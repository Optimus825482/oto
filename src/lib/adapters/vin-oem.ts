export interface ExternalVinOemResult {
  provider: "partslink24" | "tecdoc";
  vin: string;
  brand?: string;
  model?: string;
  modelYear?: number;
  engineCode?: string;
  fuelType?: string;
  engineDisplacement?: string;
  bodyClass?: string;
  plantCountry?: string;
  oemPartNumbers?: string[];
}

/**
 * Commercial VIN -> OEM part number lookup adapter (PartsLink24 / TecDoc).
 * Returns `null` gracefully in local/sandbox mode when commercial API keys
 * (`PARTSLINK24_API_KEY` or `TECDOC_API_KEY`) are not configured.
 */
export async function lookupExternalVinOem(
  vin: string
): Promise<ExternalVinOemResult | null> {
  const partslinkKey = process.env.PARTSLINK24_API_KEY?.trim();
  const tecdocKey = process.env.TECDOC_API_KEY?.trim();

  if (!partslinkKey && !tecdocKey) {
    return null;
  }

  const normalizedVin = vin.trim().toUpperCase();
  const provider: "partslink24" | "tecdoc" = partslinkKey
    ? "partslink24"
    : "tecdoc";
  const apiKey = partslinkKey || tecdocKey;
  const endpoint = partslinkKey
    ? process.env.PARTSLINK24_API_URL?.trim()
    : process.env.TECDOC_API_URL?.trim();

  if (!endpoint || !apiKey) {
    return null;
  }

  try {
    const res = await fetch(
      `${endpoint.replace(/\/+$/, "")}/vin/${encodeURIComponent(normalizedVin)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as Partial<ExternalVinOemResult>;
    return {
      provider,
      vin: normalizedVin,
      brand: data.brand,
      model: data.model,
      modelYear: data.modelYear,
      engineCode: data.engineCode,
      fuelType: data.fuelType,
      engineDisplacement: data.engineDisplacement,
      bodyClass: data.bodyClass,
      plantCountry: data.plantCountry,
      oemPartNumbers: Array.isArray(data.oemPartNumbers)
        ? data.oemPartNumbers
        : undefined,
    };
  } catch {
    return null;
  }
}
