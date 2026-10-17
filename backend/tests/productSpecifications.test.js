import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PRODUCT_SPECIFICATIONS, parseProductSpecifications } from '../services/productSpecifications.js';

test('leaves specifications untouched when the request omits the field', () => {
  assert.deepEqual(parseProductSpecifications(undefined), { valid: true, omitted: true });
});

test('parses JSON rows, trims text, and ignores incomplete rows', () => {
  const result = parseProductSpecifications(JSON.stringify([
    { key: '  وظيفة إضافية ', value: ' Power Bank  ' },
    { key: 'معلومة ناقصة', value: '   ' },
    { key: '', value: 'قيمة بلا اسم' },
  ]));

  assert.deepEqual(result, {
    valid: true,
    omitted: false,
    value: [{ key: 'وظيفة إضافية', value: 'Power Bank' }],
  });
});

test('accepts an empty array so an editor can clear the table', () => {
  assert.deepEqual(parseProductSpecifications('[]'), { valid: true, omitted: false, value: [] });
});

test('rejects malformed JSON and non-array values', () => {
  assert.equal(parseProductSpecifications('{').valid, false);
  assert.equal(parseProductSpecifications('{"key":"a","value":"b"}').valid, false);
});

test('rejects too many rows and overlong fields', () => {
  const tooMany = Array.from({ length: MAX_PRODUCT_SPECIFICATIONS + 1 }, () => ({ key: 'x', value: 'y' }));
  assert.equal(parseProductSpecifications(tooMany).valid, false);
  assert.equal(parseProductSpecifications([{ key: 'x'.repeat(81), value: 'y' }]).valid, false);
  assert.equal(parseProductSpecifications([{ key: 'x', value: 'y'.repeat(401) }]).valid, false);
});
