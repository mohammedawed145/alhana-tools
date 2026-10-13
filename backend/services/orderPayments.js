export function calculateDepositBreakdown(subtotal, configuredDeposit = 150) {
  const productTotal = Number(subtotal);
  const depositLimit = Number(configuredDeposit);
  if (!Number.isFinite(productTotal) || productTotal <= 0) {
    throw new RangeError('Product subtotal must be a positive finite amount');
  }
  if (!Number.isFinite(depositLimit) || depositLimit < 0) {
    throw new RangeError('Deposit amount must be a non-negative finite amount');
  }

  const depositAmount = Math.min(depositLimit, productTotal);
  return {
    depositAmount,
    amountDueOnDelivery: productTotal - depositAmount,
    shippingFee: 0,
    totalPrice: productTotal,
  };
}
