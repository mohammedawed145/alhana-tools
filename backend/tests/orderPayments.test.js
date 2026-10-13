import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDepositBreakdown } from '../services/orderPayments.js';

test('150 EGP deposit is taken from product subtotal and shipping remains external', () => {
  assert.deepEqual(calculateDepositBreakdown(800), {
    depositAmount: 150,
    amountDueOnDelivery: 650,
    shippingFee: 0,
    totalPrice: 800,
  });
});

test('deposit is capped at the product subtotal for orders below 150 EGP', () => {
  assert.deepEqual(calculateDepositBreakdown(90), {
    depositAmount: 90,
    amountDueOnDelivery: 0,
    shippingFee: 0,
    totalPrice: 90,
  });
});

test('invalid subtotals and deposits are rejected', () => {
  assert.throws(() => calculateDepositBreakdown(0), RangeError);
  assert.throws(() => calculateDepositBreakdown(Number.NaN), RangeError);
  assert.throws(() => calculateDepositBreakdown(200, -1), RangeError);
});
