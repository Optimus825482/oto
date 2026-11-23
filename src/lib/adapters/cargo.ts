import crypto from "node:crypto";

export interface CargoLabelResult {
  carrier: string;
  cargoCode: string;
  trackingNo: string;
  direction: "INBOUND_TO_HUB" | "OUTBOUND_TO_CUSTOMER";
  packagingStandard: string;
}

export function generateCargoLabel(
  direction: "INBOUND_TO_HUB" | "OUTBOUND_TO_CUSTOMER",
  orderNo: string
): CargoLabelResult {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  const prefix = direction === "INBOUND_TO_HUB" ? "OBP-MERKEZ" : "OBP-TESLIM";

  return {
    carrier: "Anlaşmalı Ekspres Kargo (Yurtiçi / Aras)",
    cargoCode: `${prefix}-${rand}`,
    trackingNo: `TR${Date.now().toString().slice(-8)}${rand}`,
    direction,
    packagingStandard:
      direction === "OUTBOUND_TO_CUSTOMER"
        ? "Anti-Statik ESD Poşet + Darbe Emici Markalı Kutu + Güvenlik Mühürü"
        : "Tedarikçi → OtoBeyinPazari Test Merkezi Sevk Kodu",
  };
}
