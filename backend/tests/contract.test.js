import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const model=fs.readFileSync(new URL('../models/catalog.js',import.meta.url),'utf8');
const controller=fs.readFileSync(new URL('../controllers/operationsController.js',import.meta.url),'utf8');
const routes=fs.readFileSync(new URL('../routes/index.js',import.meta.url),'utf8');

test('orders support prepaid shipping, governorate and discounted prices',()=>{
  assert.match(model,/shippingFee/);
  assert.match(model,/governorate/);
  assert.match(model,/discountPrice/);
  assert.match(model,/instapay/);
  assert.match(model,/vodafone_cash/);
  assert.match(controller,/SHIPPING_FEE/);
  assert.match(controller,/p\.discountPrice\?\?p\.price/);
});

test('receipt upload is protected for the authenticated order owner',()=>{
  assert.match(routes,/payment-receipt.*protect.*receiptUpload/);
  assert.match(controller,/order\.user\.equals\(req\.user\._id\)/);
});

test('stock reservation and order creation use a transaction',()=>{
  assert.match(controller,/startSession/);
  assert.match(controller,/withTransaction/);
  assert.match(controller,/findOneAndUpdate/);
});

test('admin order controls remain protected',()=>{
  assert.match(routes,/payment-status/);
  assert.match(routes,/shipment/);
  assert.match(routes,/\.\.\.guarded/);
});
