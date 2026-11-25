export type CategoryMeta = {
  code: "ECU" | "TCU" | "ABS" | "BCM" | "SRS" | "SENSOR" | "IMMOBILIZER" | "OTHER";
  label: string;
  shortLabel: string;
};

export const PART_CATEGORIES: CategoryMeta[] = [
  { code: "ECU", label: "Motor Beyni (ECU)", shortLabel: "MOTOR BEYNİ (ECU)" },
  { code: "TCU", label: "Şanzıman Beyni (TCU)", shortLabel: "ŞANZIMAN BEYNİ (TCU)" },
  { code: "ABS", label: "ABS / ESP Beyni", shortLabel: "ABS BEYNİ" },
  { code: "BCM", label: "Konfor Beyni (BCM/BSI)", shortLabel: "KONFOR BEYNİ" },
  { code: "SRS", label: "Airbag Beyni (SRS)", shortLabel: "AİRBAG BEYNİ" },
  { code: "SENSOR", label: "Sensörler & Göstergeler", shortLabel: "SENSÖRLER GÖSTERGELER" },
  { code: "IMMOBILIZER", label: "İmmobilizer & Kontak", shortLabel: "İMMOBİLİZER" },
  { code: "OTHER", label: "Diğer Elektronik Modüller", shortLabel: "DİĞER ÜRÜNLER" },
];

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: "Yeni Talep Alındı",
  BROADCASTED: "Tedarikçilere Yayınlandı",
  QUOTES_RECEIVED: "Teklifler Toplandı",
  OFFER_SENT: "Müşteriye Fiyat Sunuldu",
  PAID: "Güvence Ödemesi Alındı",
  SUPPLIER_SHIPPED: "Merkeze Kargolandı",
  IN_TEST_LAB: "Test Laboratuvarında",
  TEST_PASSED: "Cihaz Testi Onaylandı",
  TEST_FAILED: "Test Başarısız — Yeniden Tedarik",
  SHIPPED_TO_CUSTOMER: "Tek Tip Kargoya Verildi",
  DELIVERED: "Teslim Edildi (14 Gün Güvence)",
  RETURN_REQUESTED: "İade Talebi Açıldı",
  CANCELLED: "İptal Edildi",
};

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + " ₺";
}
