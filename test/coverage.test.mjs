import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate, coverage } from '../skills/hownter-threat-model/scripts/assessment.mjs';

const example = JSON.parse(await readFile(new URL('../examples/assessment.synthetic.json', import.meta.url)));
const seed = JSON.parse(await readFile(new URL('../skills/hownter-threat-model/assets/assessment.template.json', import.meta.url)));
// Test-only records exercise the accounting rules; never represent real approvals.
function coveredFixture() {
  const data = structuredClone(example);
  data.synthetic = false;
  data.inventory.status = 'approved';
  data.inventory.approval = { reviewer: 'Test reviewer', date: '2026-09-21', evidence: 'test://inventory-review' };
  data.models[0].synthetic = false;
  data.models[0].status = 'covered';
  data.models[0].review = { reviewer: 'Test reviewer', date: '2026-09-21', evidence: 'test://model-review' };
  return data;
}
test('complete recorded assessment counts; risk remains separate', () => {
  const r = coverage(coveredFixture());
  assert.equal(r.percentage, 100);
  assert.equal(r.open_risk.length, 1);
  assert.equal(r.mitigations.marked_mitigated, 0);
});
test('missing critical module lowers coverage', () => {
  const d = coveredFixture();
  d.inventory.modules.push({ ...d.inventory.modules[0], id: 'broker', name: 'Broker' });
  const r = coverage(d);
  assert.equal(r.percentage, 50);
  assert.deepEqual(r.modules[1].blockers, ['missing model']);
});
for (const status of ['not_started', 'in_progress', 'blocked', 'pending_review', 'stale']) {
  test(`${status} is not covered`, () => {
    const d = coveredFixture(); d.models[0].status = status;
    assert.equal(coverage(d).percentage, 0);
  });
}
test('synthetic assessment is never real coverage', () => {
  const d = coveredFixture(); d.synthetic = true;
  assert.equal(coverage(d).percentage, null);
  assert.equal(coverage(d).covered, 0);
  assert.equal(coverage(example).verified, false);
});
test('synthetic model cannot claim covered', () => {
  const d = coveredFixture(); d.models[0].synthetic = true;
  assert.equal(coverage(d).valid, false);
});
test('empty and provisional inventories have no verified percentage', () => {
  assert.equal(coverage(seed).percentage, null);
  const d = coveredFixture(); d.inventory.status = 'provisional'; d.inventory.approval = null;
  assert.equal(coverage(d).percentage, null);
  d.inventory.status = 'approved'; d.inventory.approval = coveredFixture().inventory.approval;
  d.inventory.modules = []; d.models = []; d.threats = [];
  assert.equal(coverage(d).percentage, null);
});
test('claimed covered without approval fails validation', () => {
  const d = coveredFixture(); d.models[0].review = null;
  assert.match(validate(d).join('\n'), /missing human review/);
});
test('approved inventory requires actual fields, not placeholders', () => {
  const d = coveredFixture(); d.inventory.approval.evidence = 'TODO';
  assert.match(validate(d).join('\n'), /approval evidence/);
});
test('verified controls require evidence; unverified is not auto-promoted', () => {
  const d = coveredFixture(); d.threats[0].controls[0].status = 'verified'; d.threats[0].controls[0].evidence = [];
  assert.match(validate(d).join('\n'), /verified control lacks/);
  d.threats[0].controls[0].status = 'unverified';
  assert.deepEqual(validate(d), []);
  assert.equal(d.threats[0].controls[0].status, 'unverified');
});
test('unassessed source and inventory changes invalidate coverage', () => {
  const d = coveredFixture(); d.current_revision = 'next-revision';
  assert.equal(coverage(d).valid, false);
  d.models[0].freshness.checked_revision = d.current_revision;
  assert.equal(coverage(d).valid, false);
  d.models[0].freshness.decision = 'unaffected';
  assert.equal(coverage(d).percentage, 100);
  d.inventory.version = '2';
  assert.equal(coverage(d).valid, false);
});
test('incomplete gates and missing plans cannot pass', () => {
  const d = coveredFixture(); d.models[0].completion.architecture.evidence = [];
  assert.equal(coverage(d).valid, false);
  const e = coveredFixture(); e.threats[0].verification = [];
  assert.equal(coverage(e).valid, false);
});
test('unknown references, duplicate IDs, omitted threats are rejected', () => {
  const d = coveredFixture(); d.models[0].threat_ids = ['missing'];
  assert.match(validate(d).join('\n'), /unknown threat/);
  assert.match(validate(d).join('\n'), /omitted owned threat/);
  const e = coveredFixture(); e.inventory.modules.push(e.inventory.modules[0]);
  assert.match(validate(e).join('\n'), /duplicate vault/);
});
test('accepted risk requires decision evidence', () => {
  const d = coveredFixture(); d.threats[0].status = 'accepted';
  assert.match(validate(d).join('\n'), /human decision evidence/);
});
test('schema rejects unknown fields, bad types, invalid dates', () => {
  const d = coveredFixture(); d.models[0].review.date = '2026-02-30';
  assert.match(validate(d).join('\n'), /invalid ISO date/);
  const e = coveredFixture(); e.synthetic = 'false'; e.typo = true;
  assert.match(validate(e).join('\n'), /expected boolean/);
  assert.match(validate(e).join('\n'), /unknown property/);
});
test('calculation is deterministic and leaves input untouched', () => {
  const d = coveredFixture(); const before = JSON.stringify(d);
  assert.deepEqual(coverage(d), coverage(d));
  assert.equal(JSON.stringify(d), before);
});
