const onlyDigits = value => String(value || '').replace(/\D/g, '');

export function normalizeWhatsAppRecipient(value) {
  let number = onlyDigits(value);
  if (number.startsWith('00')) number = number.slice(2);
  // Accept Egyptian local mobile numbers as well as international E.164 input.
  if (number.startsWith('0')) number = `20${number.slice(1)}`;
  return /^\d{8,15}$/.test(number) ? number : '';
}

export function buildOrderNotificationPayload(order) {
  const address = [order.shippingAddress, order.governorate]
    .filter(Boolean)
    .join('، ')
    .slice(0, 500);
  const parameters = [
    String(order._id || '').slice(-8).toUpperCase() || '—',
    String(order.customerName || '—').slice(0, 100),
    String(order.phone || '—').slice(0, 30),
    address || '—',
  ];

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizeWhatsAppRecipient(process.env.WHATSAPP_NOTIFICATION_TO),
    type: 'template',
    template: {
      name: process.env.WHATSAPP_ORDER_TEMPLATE || 'new_order_admin_alert',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar' },
      components: [{
        type: 'body',
        parameters: parameters.map(text => ({ type: 'text', text })),
      }],
    },
  };
}

export async function sendNewOrderAlert(order) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || '');
  const recipient = normalizeWhatsAppRecipient(process.env.WHATSAPP_NOTIFICATION_TO);
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v26.0';

  if (!accessToken || !/^\d+$/.test(phoneNumberId) || !recipient) {
    return { status: 'not_configured' };
  }
  if (!/^v\d+\.\d+$/.test(apiVersion)) return { status: 'not_configured' };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOrderNotificationPayload(order)),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok
      ? { status: 'sent' }
      : { status: 'failed', httpStatus: response.status };
  } catch {
    // Do not log the request body, customer's personal data, or API token.
    return { status: 'failed' };
  }
}
