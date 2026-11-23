export interface PricingBreakdown {
  purchasePrice: number;
  marginPercent: number;
  shippingCost: number;
  customerPrice: number;
  grossMargin: number;
  netProfit: number;
}

export function calculateCustomerPrice(
  purchasePrice: number,
  marginPercent: number = 22,
  shippingCost: number = 350
): PricingBreakdown {
  const safePurchase = Math.max(0, Number(purchasePrice));
  const safeMargin = Math.max(5, Math.min(80, Number(marginPercent)));
  const rawSale = safePurchase * (1 + safeMargin / 100);
  const customerPrice = Math.round(rawSale / 50) * 50;
  const grossMargin = customerPrice - safePurchase;
  const netProfit = grossMargin - shippingCost;

  return {
    purchasePrice: safePurchase,
    marginPercent: safeMargin,
    shippingCost,
    customerPrice,
    grossMargin,
    netProfit,
  };
}
