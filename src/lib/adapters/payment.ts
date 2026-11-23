import crypto from "node:crypto";

export interface EscrowPaymentInput {
  orderNo: string;
  amount: number;
  cardHolderName: string;
  cardLast4: string;
  installments?: number;
}

export interface EscrowPaymentResult {
  success: boolean;
  paymentRef: string;
  provider: string;
  escrowStatus: "ESCROW_HELD";
  paidAt: string;
}

export async function processEscrowPayment(
  input: EscrowPaymentInput
): Promise<EscrowPaymentResult> {
  const provider = process.env.PAYMENT_PROVIDER || "sandbox-paytr-iyzico";
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();

  return {
    success: true,
    paymentRef: `ESC-${input.orderNo}-${suffix}`,
    provider,
    escrowStatus: "ESCROW_HELD",
    paidAt: new Date().toISOString(),
  };
}
