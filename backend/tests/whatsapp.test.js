import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderNotificationPayload,
  normalizeWhatsAppRecipient,
  sendNewOrderAlert,
} from '../services/whatsapp.js';

const envKeys = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_NOTIFICATION_TO',
  'WHATSAPP_ORDER_TEMPLATE',
  'WHATSAPP_TEMPLATE_LANGUAGE',
  'WHATSAPP_GRAPH_API_VERSION',
];
const sampleOrder = {
  _id: '64abcdeffedcba9876543210',
  customerName: 'عميل اختبار',
  phone: '01011112222',
  governorate: 'دمياط',
  shippingAddress: 'عنوان اختباري',
};

function saveEnvironment() {
  return Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
}

function restoreEnvironment(previous) {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}

test('WhatsApp recipient accepts Egyptian local and international numbers', () => {
  assert.equal(normalizeWhatsAppRecipient('01090914985'), '201090914985');
  assert.equal(normalizeWhatsAppRecipient('+20 1090914985'), '201090914985');
  assert.equal(normalizeWhatsAppRecipient('not-a-number'), '');
});

test('order alert remains disabled when server credentials are missing', async () => {
  const previous = saveEnvironment();
  try {
    for (const key of envKeys) delete process.env[key];
    assert.deepEqual(await sendNewOrderAlert(sampleOrder), { status: 'not_configured' });
  } finally {
    restoreEnvironment(previous);
  }
});

test('order notification uses an Arabic approved template and only configured recipient', async () => {
  const previous = saveEnvironment();
  const previousFetch = globalThis.fetch;
  try {
    process.env.WHATSAPP_ACCESS_TOKEN = 'unit-test-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789012345';
    process.env.WHATSAPP_NOTIFICATION_TO = '01090914985';
    process.env.WHATSAPP_ORDER_TEMPLATE = 'new_order_admin_alert';
    process.env.WHATSAPP_TEMPLATE_LANGUAGE = 'ar';
    process.env.WHATSAPP_GRAPH_API_VERSION = 'v26.0';

    let captured;
    globalThis.fetch = async (url, options) => {
      captured = { url, options };
      return { ok: true, status: 200 };
    };

    assert.deepEqual(await sendNewOrderAlert(sampleOrder), { status: 'sent' });
    assert.equal(captured.url, 'https://graph.facebook.com/v26.0/123456789012345/messages');
    assert.equal(captured.options.headers.Authorization, 'Bearer unit-test-token');
    const payload = JSON.parse(captured.options.body);
    assert.equal(payload.messaging_product, 'whatsapp');
    assert.equal(payload.to, '201090914985');
    assert.equal(payload.template.name, 'new_order_admin_alert');
    assert.deepEqual(payload.template.components[0].parameters.map(item => item.text), [
      '76543210',
      'عميل اختبار',
      '01011112222',
      'عنوان اختباري، دمياط',
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnvironment(previous);
  }
});

test('WhatsApp API failure does not expose response or customer data', async () => {
  const previous = saveEnvironment();
  const previousFetch = globalThis.fetch;
  try {
    process.env.WHATSAPP_ACCESS_TOKEN = 'unit-test-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789012345';
    process.env.WHATSAPP_NOTIFICATION_TO = '201090914985';
    globalThis.fetch = async () => ({ ok: false, status: 400 });
    assert.deepEqual(await sendNewOrderAlert(sampleOrder), { status: 'failed', httpStatus: 400 });
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnvironment(previous);
  }
});
