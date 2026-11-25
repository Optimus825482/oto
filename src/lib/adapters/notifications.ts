import type { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface SendNotificationInput {
  channel: NotificationChannel;
  recipient: string;
  template: string;
  message: string;
  relatedInquiryId?: string;
}

export async function sendNotification(input: SendNotificationInput) {
  // Production hook: plug NetGSM / WhatsApp Business API here when env tokens are configured.
  const provider = process.env.SMS_PROVIDER || "sandbox";
  const status = provider === "sandbox" ? "SANDBOX_SENT" : "SENT";

  return prisma.notificationLog.create({
    data: {
      channel: input.channel,
      recipient: input.recipient,
      template: input.template,
      message: input.message,
      status,
      relatedInquiryId: input.relatedInquiryId,
    },
  });
}

export function buildCustomerQuoteSms(params: {
  partCode: string;
  customerPriceFormatted: string;
  offerUrl: string;
}): string {
  return `Sayın Müşterimiz, aradığınız ${params.partCode} tedarik ağımızda bulunmuştur. Test Onaylı & Faturalı Fiyat: ${params.customerPriceFormatted} (KDV & Tek Tip Kargo Dahil, 14 Gün İade Güvenceli). Güvenli Ödeme Linki: ${params.offerUrl}`;
}
