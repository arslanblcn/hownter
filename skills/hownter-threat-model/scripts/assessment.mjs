#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const schema = JSON.parse(await readFile(new URL('../assets/assessment.schema.json', import.meta.url), 'utf8'));

// Deliberately scoped to the keywords used in our bundled schema. This is not a
// general-purpose JSON Schema implementation. Unknown schema keywords fail closed.
const supported = new Set(['$schema', '$id', 'title', 'type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'minLength', 'format']);
function check(value, rule, at, errors) {
  for (const key of Object.keys(rule)) if (!supported.has(key)) throw new Error(`Unsupported schema keyword ${key}`);
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    if (!types.includes(actual)) { errors.push(`${at}: expected ${types.join('|')}, got ${actual}`); return; }
    if (value === null) return;
  }
  if (Object.hasOwn(rule, 'const') && value !== rule.const) errors.push(`${at}: expected ${rule.const}`);
  if (rule.enum && !rule.enum.includes(value)) errors.push(`${at}: invalid enum value`);
  if (typeof value === 'string') {
    if (rule.minLength && value.trim().length < rule.minLength) errors.push(`${at}: must not be blank`);
    if (rule.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors.push(`${at}: invalid ISO date`);
  }
  if (Array.isArray(value) && rule.items) value.forEach((v, i) => check(v, rule.items, `${at}[${i}]`, errors));
  if (value && typeof value === 'object' && !Array.isArray(value) && rule.properties) {
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${at}.${key}: required`);
    for (const [key, v] of Object.entries(value)) {
      if (Object.hasOwn(rule.properties, key)) check(v, rule.properties[key], `${at}.${key}`, errors);
      else if (rule.additionalProperties === false) errors.push(`${at}.${key}: unknown property`);
    }
  }
}
const placeholder = /^(?:UNRESOLVED|UNKNOWN|TODO|TBD|PLACEHOLDER|<.*>)$/i;
function evidencePresent(items) { return items.length > 0 && items.every(x => !placeholder.test(x.trim())); }
function approvalPresent(a) { return a !== null && [a.reviewer, a.date, a.evidence].every(x => !placeholder.test(x.trim())); }

export function coverageBlockers(data, model) {
  if (!model) return ['missing model'];
  const reasons = [];
  if (model.status !== 'covered') reasons.push(`status: ${model.status}`);
  if (model.synthetic) reasons.push('synthetic model');
  if (model.inventory_version !== data.inventory.version) reasons.push('inventory version changed');
  if (placeholder.test(model.analyzed_revision)) reasons.push('unresolved analyzed revision');
  for (const [name, gate] of Object.entries(model.completion)) {
    if (!gate.complete || !evidencePresent(gate.evidence)) reasons.push(`incomplete gate: ${name}`);
  }
  if (!approvalPresent(model.review)) reasons.push('missing human review evidence');
  const f = model.freshness;
  if (f.checked_revision !== data.current_revision || placeholder.test(data.current_revision) || !evidencePresent(f.evidence)) reasons.push('freshness not established');
  if (!['unchanged', 'unaffected'].includes(f.decision)) reasons.push(`change impact: ${f.decision}`);
  if (f.decision === 'unchanged' && model.analyzed_revision !== data.current_revision) reasons.push('revision changed without impact assessment');
  if (placeholder.test(model.artifact)) reasons.push('unresolved model artifact');
  if (Object.values(model.ai_provenance).some(v => placeholder.test(v))) reasons.push('incomplete AI provenance');
  return reasons;
}

export function validate(data) {
  const errors = [];
  check(data, schema, '$', errors);
  if (errors.length) return errors;
  function unique(items, field, label) {
    const set = new Set();
    for (const item of items) { if (set.has(item[field])) errors.push(`${label}: duplicate ${item[field]}`); set.add(item[field]); }
    return set;
  }
  const moduleIds = unique(data.inventory.modules, 'id', 'modules');
  const threatIds = unique(data.threats, 'id', 'threats');
  unique(data.models, 'module_id', 'models');
  if (data.inventory.status === 'approved' && !approvalPresent(data.inventory.approval)) errors.push('approved inventory requires human approval evidence');
  for (const module of data.inventory.modules) {
    for (const dep of module.dependencies) if (!moduleIds.has(dep)) errors.push(`${module.id}: unknown dependency ${dep}`);
  }
  for (const threat of data.threats) {
    if (!moduleIds.has(threat.module_id)) errors.push(`${threat.id}: unknown module ${threat.module_id}`);
    for (const control of threat.controls) if (control.status === 'verified' && !evidencePresent(control.evidence)) errors.push(`${threat.id}: verified control lacks evidence`);
    if (['accepted', 'dismissed'].includes(threat.status) && !evidencePresent(threat.review_evidence)) errors.push(`${threat.id}: ${threat.status} requires human decision evidence`);
    if (threat.evidence_status === 'observed' && !evidencePresent(threat.evidence)) errors.push(`${threat.id}: observed threat lacks evidence`);
  }
  for (const model of data.models) {
    if (!moduleIds.has(model.module_id)) errors.push(`model: unknown module ${model.module_id}`);
    if (new Set(model.threat_ids).size !== model.threat_ids.length) errors.push(`${model.module_id}: duplicate threat reference`);
    for (const id of model.threat_ids) if (!threatIds.has(id)) errors.push(`${model.module_id}: unknown threat ${id}`);
    for (const threat of data.threats.filter(t => t.module_id === model.module_id)) {
      if (!model.threat_ids.includes(threat.id)) errors.push(`${model.module_id}: omitted owned threat ${threat.id}`);
    }
    if (model.status === 'covered') {
      for (const reason of coverageBlockers(data, model)) errors.push(`${model.module_id}: invalid covered claim: ${reason}`);
      for (const threat of data.threats.filter(t => model.threat_ids.includes(t.id))) {
        if (![threat.attack_path, threat.mitigations, threat.verification, threat.acceptance_criteria].every(evidencePresent)) errors.push(`${threat.id}: covered model requires attack path, mitigation and verification plans`);
        if (placeholder.test(threat.owner) || placeholder.test(threat.disposition)) errors.push(`${threat.id}: covered model requires assigned owner and disposition`);
      }
    }
  }
  return errors;
}

export function coverage(data) {
  const errors = validate(data);
  if (errors.length) return { valid: false, verified: false, percentage: null, errors };
  const critical = data.inventory.modules.filter(m => m.critical);
  const modules = critical.map(module => {
    const model = data.models.find(m => m.module_id === module.id);
    const blockers = coverageBlockers(data, model);
    return { id: module.id, status: model?.status ?? 'not_started', covered: blockers.length === 0, blockers };
  });
  const reasons = [];
  if (data.synthetic) reasons.push('synthetic assessment: excluded from real coverage');
  if (data.inventory.status !== 'approved') reasons.push('inventory is provisional');
  if (!critical.length) reasons.push('no critical modules in inventory');
  if (placeholder.test(data.current_revision)) reasons.push('current revision is unresolved');
  const verified = reasons.length === 0;
  const covered = verified ? modules.filter(m => m.covered).length : 0;
  return {
    valid: true, verified, inventory_version: data.inventory.version, current_revision: data.current_revision,
    covered, total: critical.length, percentage: verified ? (covered / critical.length) * 100 : null,
    reasons, modules, open_risk: data.threats.filter(t => !['mitigated', 'dismissed'].includes(t.status) && ['high', 'critical', 'unknown'].includes(t.residual_risk)).map(t => ({ id: t.id, risk: t.residual_risk, status: t.status })),
    mitigations: { total: data.threats.length, marked_mitigated: data.threats.filter(t => t.status === 'mitigated').length },
    limitation: 'Checks recorded evidence references; does not authenticate approvals or prove inventory completeness, control effectiveness, or current source revision.'
  };
}

export async function runAssessment(command, filename, minimum) {
  if (!['validate', 'coverage'].includes(command) || !filename) throw new Error('Usage: assessment.mjs <validate|coverage> <assessment.json> [--min-coverage 0..100]');
  if (minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0 || minimum > 100)) throw new Error('min-coverage must be a number from 0 to 100');
  const data = JSON.parse(await readFile(filename, 'utf8'));
  const report = command === 'validate' ? { errors: validate(data) } : coverage(data);
  if (command === 'validate') report.valid = report.errors.length === 0;
  console.log(JSON.stringify(report, null, 2));
  return !report.valid ? 1 : command === 'coverage' && minimum !== undefined && (!report.verified || report.percentage < minimum) ? 2 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, filename, flag, raw, ...extra] = process.argv.slice(2);
    if (extra.length || (flag && (flag !== '--min-coverage' || raw === undefined)) || (command === 'validate' && flag)) throw new Error('Invalid arguments');
    process.exitCode = await runAssessment(command, filename, raw === undefined ? undefined : Number(raw));
  } catch (e) { console.error(`Hownter: ${e.message}`); process.exitCode = 1; }
}
