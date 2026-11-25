import crypto from "node:crypto";
import type { InvoiceType } from "@prisma/client";

export interface EInvoiceResult {
  invoiceNo: string;
  invoiceType: InvoiceType;
  issuedAt: string;
  issuerTitle: string;
  issuerTaxOffice: string;
  issuerVkn: string;
  kdvRate: number;
  subtotal: number;
  kdvAmount: number;
  totalAmount: number;
}

export function issueEInvoice(params: {
  orderNo: string;
  totalAmount: number;
  invoiceType: InvoiceType;
}): EInvoiceResult {
  const year = new Date().getFullYear();
  const seq = crypto.randomInt(100000, 999999);
  const prefix = params.invoiceType === "CORPORATE" ? "OBPF" : "OBPA";
  const kdvRate = 0.2;
  const subtotal = Math.round((params.totalAmount / (1 + kdvRate)) * 100) / 100;
  const kdvAmount = Math.round((params.totalAmount - subtotal) * 100) / 100;

  return {
    invoiceNo: `${prefix}${year}${seq}`,
    invoiceType: params.invoiceType,
    issuedAt: new Date().toISOString(),
    issuerTitle: "OtoBeyinPazari Otomotiv Elektroniği A.Ş.",
    issuerTaxOffice: "İkitelli Vergi Dairesi",
    issuerVkn: "6480923410",
    kdvRate: 20,
    subtotal,
    kdvAmount,
    totalAmount: params.totalAmount,
  };
}
