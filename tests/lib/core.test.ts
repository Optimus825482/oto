import { describe, it, expect, vi, afterEach } from "vitest";
import { normalizePartCode, decodeVin, decodeVinLive } from "@/lib/vin";
import { calculateCustomerPrice } from "@/lib/pricing";

describe("Part Code Normalization", () => {
  it("normalizes spaces, hyphens, and mixed case identically", () => {
    expect(normalizePartCode("A646 150 00 00")).toBe("A6461500000");
    expect(normalizePartCode("a646-150 0000")).toBe("A6461500000");
    expect(normalizePartCode("  0AM-927-769 d ")).toBe("0AM927769D");
  });
});

describe("17-Char VIN Decoder", () => {
  it("decodes valid European/Turkish VINs accurately", () => {
    const mercedes = decodeVin("WDF63960313482910");
    expect(mercedes.valid).toBe(true);
    expect(mercedes.brand).toBe("Mercedes-Benz (Ticari)");
    expect(mercedes.wmi).toBe("WDF");

    const vw = decodeVin("WVWZZZ3CZEE104829");
    expect(vw.valid).toBe(true);
    expect(vw.brand).toBe("Volkswagen");
    expect(vw.modelYear).toBe(2014);

    const bmw = decodeVin("WBA3D310XJ5541201");
    expect(bmw.valid).toBe(true);
    expect(bmw.brand).toBe("BMW");
    expect(bmw.modelYear).toBe(2018);
  });

  it("rejects invalid VIN length or forbidden characters I, O, Q", () => {
    const tooShort = decodeVin("WDF63960313");
    expect(tooShort.valid).toBe(false);
    expect(tooShort.error).toContain("17 karakter");

    const forbidden = decodeVin("WDF6396031O482910");
    expect(forbidden.valid).toBe(false);
    expect(forbidden.error).toContain("I, O veya Q");
  });
});

describe("Pricing & Margin Calculator", () => {
  it("applies 22% margin, rounds to nearest 50 TL, and computes net profit after shipping", () => {
    const res = calculateCustomerPrice(8000, 22, 350);
    // 8000 * 1.22 = 9760 -> nearest 50 = 9750
    expect(res.customerPrice).toBe(9750);
    expect(res.grossMargin).toBe(1750);
    expect(res.netProfit).toBe(1400);
  });
});

describe("Live NHTSA vPIC VIN Decoder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enriches valid VIN with live NHTSA vPIC fields and normalizes brand names", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Results: [
          {
            Make: "VOLKSWAGEN",
            Model: "Passat",
            ModelYear: "2014",
            FuelTypePrimary: "Diesel",
            DisplacementL: "2.0",
            BodyClass: "Sedan/Saloon",
            PlantCountry: "GERMANY",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await decodeVinLive("WVWZZZ3CZEE104829");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.valid).toBe(true);
    expect(res.source).toBe("nhtsa_live");
    expect(res.brand).toBe("Volkswagen");
    expect(res.model).toBe("Passat");
    expect(res.modelYear).toBe(2014);
    expect(res.fuelType).toBe("Diesel");
    expect(res.engineDisplacement).toBe("2.0L");
    expect(res.bodyClass).toBe("Sedan/Saloon");
    expect(res.plantCountry).toBe("GERMANY");
  });

  it("ignores 'Not Applicable' or empty NHTSA fields and keeps local WMI brand", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Results: [
          {
            Make: "",
            Model: "Not Applicable",
            ModelYear: "Not Applicable",
            FuelTypePrimary: "Not Applicable",
            DisplacementL: "",
            BodyClass: "Not Applicable",
            PlantCountry: "TURKEY",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await decodeVinLive("NM0EXXTTRG1234567");
    expect(res.valid).toBe(true);
    expect(res.source).toBe("nhtsa_live");
    expect(res.brand).toBe("Ford Otosan");
    expect(res.model).toBeUndefined();
    expect(res.fuelType).toBeUndefined();
    expect(res.engineDisplacement).toBeUndefined();
    expect(res.bodyClass).toBeUndefined();
    expect(res.plantCountry).toBe("TURKEY");
  });

  it("falls back to local WMI on network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network timeout"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await decodeVinLive("WDF63960313482910");
    expect(res.valid).toBe(true);
    expect(res.source).toBe("local_wmi");
    expect(res.brand).toBe("Mercedes-Benz (Ticari)");
    expect(res.region).toBe("Almanya");
    expect(res.suggestedEcuFamilies?.length).toBeGreaterThan(0);
  });

  it("returns invalid VIN immediately without calling external fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await decodeVinLive("WDF6396031O482910");
    expect(res.valid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
