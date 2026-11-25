import { lookupExternalVinOem } from "@/lib/adapters/vin-oem";

export type VinDecodeSource = "nhtsa_live" | "local_wmi" | "external_oem";

export interface VinDecodeResult {
  valid: boolean;
  vin: string;
  error?: string;
  wmi?: string;
  brand?: string;
  region?: string;
  modelYear?: number;
  suggestedEcuFamilies?: string[];
  model?: string;
  fuelType?: string;
  engineDisplacement?: string;
  bodyClass?: string;
  plantCountry?: string;
  source?: VinDecodeSource;
}

const WMI_MAP: Record<
  string,
  { brand: string; region: string; ecuFamilies: string[] }
> = {
  WDB: { brand: "Mercedes-Benz", region: "Almanya", ecuFamilies: ["Bosch EDC16/EDC17", "Continental SIM271", "Delphi CRD2/CRD3"] },
  WDD: { brand: "Mercedes-Benz", region: "Almanya", ecuFamilies: ["Bosch MED17.7", "Bosch EDC17CP46", "Delphi CRD3"] },
  WDF: { brand: "Mercedes-Benz (Ticari)", region: "Almanya", ecuFamilies: ["Bosch EDC16CP31", "Delphi CRD2.35", "Bosch EDC17CP10"] },
  W1K: { brand: "Mercedes-Benz", region: "Almanya", ecuFamilies: ["Bosch MD1CP001", "Bosch MG1CP002"] },
  WVW: { brand: "Volkswagen", region: "Almanya", ecuFamilies: ["Bosch EDC17C46/C64", "Continental Simos PCR2.1", "DQ200 DSG TCU"] },
  WV1: { brand: "Volkswagen Ticari", region: "Almanya", ecuFamilies: ["Bosch EDC17CP20", "Delphi DCM6.2"] },
  WAU: { brand: "Audi", region: "Almanya", ecuFamilies: ["Bosch EDC17CP44", "Bosch MED17.1", "DL501 S-Tronic TCU"] },
  WBA: { brand: "BMW", region: "Almanya", ecuFamilies: ["Bosch EDC17C50/C56", "Bosch MEVD17.2", "ATE DSC/ABS"] },
  WBS: { brand: "BMW M", region: "Almanya", ecuFamilies: ["Bosch MEVD17.2.G", "Continental MSD87"] },
  W0L: { brand: "Opel", region: "Almanya", ecuFamilies: ["ACDelco E83/E98", "Bosch EDC17C59", "Magneti Marelli MJD 6O2"] },
  VF1: { brand: "Renault", region: "Fransa", ecuFamilies: ["Continental SID305/SID307/SID310", "Bosch EDC17C42", "Valeo V42"] },
  VF3: { brand: "Peugeot", region: "Fransa", ecuFamilies: ["Bosch EDC17C10/C60", "Delphi DCM3.5/DCM6.2", "Siemens SID807"] },
  VF7: { brand: "Citroën", region: "Fransa", ecuFamilies: ["Bosch EDC17C10/C60", "Continental SID807", "Valeo BSI"] },
  WF0: { brand: "Ford Avrupa", region: "Almanya / Türkiye", ecuFamilies: ["Continental SID208/SID209", "Delphi DCM3.5", "Bosch EDC17C70"] },
  NM0: { brand: "Ford Otosan", region: "Türkiye", ecuFamilies: ["Continental SID208", "Bosch EDC17C10"] },
  ZFA: { brand: "Fiat", region: "İtalya", ecuFamilies: ["Magneti Marelli MJD 8F3/9DF", "Bosch EDC16C39", "Bosch EDC17C69"] },
  NM4: { brand: "Tofaş / Fiat", region: "Türkiye", ecuFamilies: ["Magneti Marelli MJD 8F3/9DF", "Bosch ME17.3.0"] },
  NLH: { brand: "Hyundai Assan", region: "Türkiye", ecuFamilies: ["Bosch EDC17C08/C57", "Kefico MEG17.9.12"] },
  KMH: { brand: "Hyundai", region: "Güney Kore", ecuFamilies: ["Bosch EDC17C57", "Delphi DCM3.7"] },
  NMT: { brand: "Toyota", region: "Türkiye", ecuFamilies: ["Denso 89661", "Bosch EDC17CP07"] },
  JTD: { brand: "Toyota", region: "Japonya", ecuFamilies: ["Denso ECU", "Advics ABS"] },
  TMB: { brand: "Škoda", region: "Çekya", ecuFamilies: ["Bosch EDC17C64", "Continental Simos 18"] },
  VSS: { brand: "SEAT", region: "İspanya", ecuFamilies: ["Bosch EDC17C64", "DQ200 DSG TCU"] },
  UU1: { brand: "Dacia", region: "Romanya", ecuFamilies: ["Continental SID306/EMS3125", "Bosch EDC17C42"] },
};

const YEAR_CODE_MAP: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026,
  "6": 2006, "7": 2007, "8": 2008, "9": 2009,
};

export function normalizePartCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function decodeVin(rawVin: string): VinDecodeResult {
  const vin = rawVin.trim().toUpperCase().replace(/\s+/g, "");

  if (vin.length !== 17) {
    return {
      valid: false,
      vin,
      error: "Şase numarası (VIN) tam olarak 17 karakter olmalıdır.",
    };
  }

  if (/[IOQ]/.test(vin)) {
    return {
      valid: false,
      vin,
      error: "Geçersiz şase numarası: VIN içinde I, O veya Q harfleri bulunamaz.",
    };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return {
      valid: false,
      vin,
      error: "Şase numarası yalnızca standart harf ve rakamlardan oluşmalıdır.",
    };
  }

  const wmi = vin.slice(0, 3);
  const yearChar = vin.charAt(9);
  const wmiInfo = WMI_MAP[wmi];

  return {
    valid: true,
    vin,
    wmi,
    brand: wmiInfo?.brand ?? "Diğer / Avrupa Üretici",
    region: wmiInfo?.region ?? "Uluslararası",
    modelYear: YEAR_CODE_MAP[yearChar],
    suggestedEcuFamilies: wmiInfo?.ecuFamilies ?? ["OEM Beyin Ailesi — Manuel Doğrulama"],
  };
}

const BRAND_DISPLAY_OVERRIDES: Record<string, string> = {
  "MERCEDES-BENZ": "Mercedes-Benz",
  "MERCEDES BENZ": "Mercedes-Benz",
  VOLKSWAGEN: "Volkswagen",
  BMW: "BMW",
  AUDI: "Audi",
  OPEL: "Opel",
  RENAULT: "Renault",
  PEUGEOT: "Peugeot",
  CITROEN: "Citroën",
  "CITROËN": "Citroën",
  FORD: "Ford",
  FIAT: "Fiat",
  HYUNDAI: "Hyundai",
  TOYOTA: "Toyota",
  SKODA: "Škoda",
  "ŠKODA": "Škoda",
  SEAT: "SEAT",
  DACIA: "Dacia",
  GMC: "GMC",
  MINI: "MINI",
  MG: "MG",
  BYD: "BYD",
  TOGG: "TOGG",
};

function cleanNhtsaField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "not applicable") {
    return undefined;
  }
  return trimmed;
}

function normalizeBrandName(rawMake: string): string {
  const upper = rawMake.trim().toUpperCase();
  if (BRAND_DISPLAY_OVERRIDES[upper]) {
    return BRAND_DISPLAY_OVERRIDES[upper];
  }
  return upper
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || part === "-") return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

function formatDisplacement(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return raw.toUpperCase().endsWith("L") ? raw : `${raw}L`;
}

/**
 * Decodes a 17-char VIN using local WMI rules enriched via external commercial OEM
 * adapters (if configured) or the live NHTSA vPIC API, falling back to local WMI on failure.
 */
export async function decodeVinLive(rawVin: string): Promise<VinDecodeResult> {
  const base = decodeVin(rawVin);
  if (!base.valid) {
    return base;
  }

  const oemMatch = await lookupExternalVinOem(base.vin);
  if (oemMatch) {
    return {
      ...base,
      brand: oemMatch.brand || base.brand,
      model: oemMatch.model,
      modelYear: oemMatch.modelYear ?? base.modelYear,
      fuelType: oemMatch.fuelType,
      engineDisplacement: formatDisplacement(oemMatch.engineDisplacement),
      bodyClass: oemMatch.bodyClass,
      plantCountry: oemMatch.plantCountry,
      source: "external_oem",
    };
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(
      base.vin
    )}?format=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return { ...base, source: "local_wmi" };
    }

    const payload = (await res.json()) as {
      Results?: Array<Record<string, unknown>>;
    };
    const row = payload?.Results?.[0];
    if (!row) {
      return { ...base, source: "local_wmi" };
    }

    const nhtsaMake = cleanNhtsaField(row.Make);
    const model = cleanNhtsaField(row.Model);
    const modelYearRaw = cleanNhtsaField(row.ModelYear);
    const parsedYear = modelYearRaw ? Number.parseInt(modelYearRaw, 10) : NaN;
    const modelYear =
      Number.isFinite(parsedYear) && parsedYear >= 1980 && parsedYear <= 2100
        ? parsedYear
        : base.modelYear;
    const fuelType = cleanNhtsaField(row.FuelTypePrimary);
    const engineDisplacement = formatDisplacement(
      cleanNhtsaField(row.DisplacementL)
    );
    const bodyClass = cleanNhtsaField(row.BodyClass);
    const plantCountry = cleanNhtsaField(row.PlantCountry);

    return {
      ...base,
      brand: nhtsaMake ? normalizeBrandName(nhtsaMake) : base.brand,
      model,
      modelYear,
      fuelType,
      engineDisplacement,
      bodyClass,
      plantCountry,
      source: "nhtsa_live",
    };
  } catch {
    return { ...base, source: "local_wmi" };
  }
}
