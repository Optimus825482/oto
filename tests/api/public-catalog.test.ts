import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
    catalogPart: { findMany: vi.fn() },
    inquiry: { create: vi.fn(), findUnique: vi.fn() },
    supplierOffer: { findUnique: vi.fn() },
    testLabRecord: { findUnique: vi.fn() },
    notificationLog: { create: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE_NAME: "obp_session",
  verifyPassword: vi.fn(),
  createSessionToken: vi.fn(),
  getSessionUser: vi.fn(),
  requireRole: vi.fn(),
}));

import { GET as catalogGET } from "@/app/api/catalog/route";
import { POST as vinDecodePOST } from "@/app/api/vin/decode/route";
import {
  POST as inquiriesPOST,
  GET as inquiriesGET,
} from "@/app/api/inquiries/route";
import { GET as offerGET } from "@/app/api/offers/[token]/route";
import { GET as certificateGET } from "@/app/api/certificates/[code]/route";

describe("Public, Catalog, VIN, Inquiry, Offer & Certificate APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/catalog", () => {
    it("searches normalized part code against normalizedCode and crossRefCodes", async () => {
      const fakeParts = [
        {
          id: "part-1",
          oemCode: "A646 150 00 00",
          normalizedCode: "A6461500000",
          crossRefCodes: ["A6461500000", "0281015053", "EDC16CP31"],
          brand: "Mercedes-Benz",
          category: "ECU",
        },
      ];
      mockPrisma.catalogPart.findMany.mockResolvedValue(fakeParts);

      const req = new Request(
        "http://localhost:3000/api/catalog?q=a646-150%200000&category=ECU&brand=Mercedes-Benz"
      );
      const res = await catalogGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.items).toHaveLength(1);
      expect(json.total).toBe(1);
      expect(json.items[0].oemCode).toBe("A646 150 00 00");

      const findManyArg = mockPrisma.catalogPart.findMany.mock.calls[0][0];
      expect(findManyArg.where.category).toBe("ECU");
      expect(findManyArg.where.brand).toEqual({
        contains: "Mercedes-Benz",
        mode: "insensitive",
      });
      expect(findManyArg.where.OR).toEqual(
        expect.arrayContaining([
          { normalizedCode: { contains: "A6461500000", mode: "insensitive" } },
          { crossRefCodes: { has: "A6461500000" } },
          { oemCode: { contains: "a646-150 0000", mode: "insensitive" } },
        ])
      );
    });
  });

  describe("POST /api/vin/decode", () => {
    it("returns 200 with decoded vehicle data for valid 17-char VIN", async () => {
      const req = new Request("http://localhost:3000/api/vin/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: "WVWZZZ3CZEE104829" }),
      });

      const res = await vinDecodePOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.brand).toBe("Volkswagen");
      expect(json.modelYear).toBe(2014);
    });

    it("returns 400 for VIN containing forbidden character O", async () => {
      const req = new Request("http://localhost:3000/api/vin/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: "WDF6396031O482910" }),
      });

      const res = await vinDecodePOST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.valid).toBe(false);
      expect(json.error).toContain("I, O veya Q");
    });
  });

  describe("POST & GET /api/inquiries", () => {
    it("creates inquiry with OBP-XXXXXX code and normalized part code", async () => {
      mockPrisma.inquiry.create.mockImplementation(async ({ data }) => ({
        id: "inq-1",
        ...data,
        createdAt: new Date("2026-11-23T12:00:00Z"),
      }));
      mockPrisma.notificationLog.create.mockResolvedValue({ id: "notif-1" });

      const req = new Request("http://localhost:3000/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "Ahmet Demir",
          customerPhone: "0532 555 12 34",
          partCode: "a646-150 0000",
          vin: "WDF63960313482910",
          category: "ECU",
        }),
      });

      const res = await inquiriesPOST(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.inquiry.code).toMatch(/^OBP-\d{6}$/);
      expect(json.inquiry.status).toBe("NEW");
      expect(json.inquiry.brand).toBe("Mercedes-Benz (Ticari)");

      const createArg = mockPrisma.inquiry.create.mock.calls[0][0].data;
      expect(createArg.normalizedPartCode).toBe("A6461500000");
      expect(createArg.status).toBe("NEW");
    });

    it("returns sanitized tracking info with ZERO supplier or purchasePrice leak", async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue({
        code: "OBP-202603",
        status: "SHIPPED_TO_CUSTOMER",
        partCode: "3451 6864 677",
        vin: "WBA3D310X0J554120",
        brand: "BMW",
        category: "ABS",
        customerOfferPrice: 11450,
        paymentToken: "paid-bmw-2026",
        createdAt: new Date("2026-11-21T10:00:00Z"),
        updatedAt: new Date("2026-11-23T10:00:00Z"),
        // Sensitive fields intentionally injected in mock to verify sanitization
        supplierId: "sup-secret-1",
        supplier: { companyName: "Gizli Tedarikçi" },
        purchasePrice: 9400,
        netProfit: 1700,
        offers: [{ id: "off-1", purchasePrice: 9400 }],
        order: {
          orderNo: "SIP-202603",
          status: "SHIPPED_TO_CUSTOMER",
          paymentStatus: "ESCROW_HELD",
          outboundCargoCode: "OBP-TESLIM-7D92E4",
          outboundTrackingNo: "TR9088776655",
          invoiceNo: "OBPF2026482190",
          returnDeadlineAt: new Date("2026-12-07T10:00:00Z"),
          supplierId: "sup-secret-1",
          purchasePrice: 9400,
          netProfit: 1700,
          testLabRecord: {
            certificateCode: "CERT-OBP-202603",
            result: "PASS",
            testedAt: new Date("2026-11-22T14:00:00Z"),
          },
        },
      });

      const req = new Request(
        "http://localhost:3000/api/inquiries?code=OBP-202603"
      );
      const res = await inquiriesGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.inquiry.code).toBe("OBP-202603");
      expect(json.inquiry.order.certificateCode).toBe("CERT-OBP-202603");

      // Zero supplier leak checks
      expect(json).not.toHaveProperty("supplier");
      expect(json.inquiry).not.toHaveProperty("supplier");
      expect(json.inquiry).not.toHaveProperty("supplierId");
      expect(json.inquiry).not.toHaveProperty("purchasePrice");
      expect(json.inquiry).not.toHaveProperty("netProfit");
      expect(json.inquiry).not.toHaveProperty("offers");
      expect(json.inquiry.order).not.toHaveProperty("supplier");
      expect(json.inquiry.order).not.toHaveProperty("supplierId");
      expect(json.inquiry.order).not.toHaveProperty("purchasePrice");
      expect(json.inquiry.order).not.toHaveProperty("netProfit");

      const serialized = JSON.stringify(json);
      expect(serialized).not.toContain("Gizli Tedarikçi");
      expect(serialized).not.toContain("sup-secret-1");
      expect(serialized).not.toContain("purchasePrice");
    });
  });

  describe("GET /api/offers/[token]", () => {
    it("returns sanitized offer with ZERO supplier or purchasePrice leak", async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue({
        code: "OBP-202602",
        partCode: "0AM 927 769 D",
        vin: "WVWZZZ3CZEE104829",
        brand: "Volkswagen",
        category: "TCU",
        status: "OFFER_SENT",
        customerOfferPrice: 14050,
        createdAt: new Date("2026-11-23T08:00:00Z"),
        // Sensitive fields injected to verify stripping
        supplierId: "sup-secret-2",
        supplier: { companyName: "Bursa VAG Elektronik" },
        purchasePrice: 11500,
        netProfit: 2200,
        offers: [{ id: "off-2", purchasePrice: 11500 }],
        order: null,
      });

      const res = await offerGET(
        new Request("http://localhost:3000/api/offers/demo-dsg-2026"),
        { params: Promise.resolve({ token: "demo-dsg-2026" }) }
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.offer.code).toBe("OBP-202602");
      expect(json.offer.customerOfferPrice).toBe(14050);

      expect(json).not.toHaveProperty("supplier");
      expect(json.offer).not.toHaveProperty("supplier");
      expect(json.offer).not.toHaveProperty("supplierId");
      expect(json.offer).not.toHaveProperty("purchasePrice");
      expect(json.offer).not.toHaveProperty("netProfit");
      expect(json.offer).not.toHaveProperty("offers");

      const serialized = JSON.stringify(json);
      expect(serialized).not.toContain("Bursa VAG Elektronik");
      expect(serialized).not.toContain("11500");
    });
  });

  describe("GET /api/certificates/[code]", () => {
    it("returns 404 when certificate is missing", async () => {
      mockPrisma.testLabRecord.findUnique.mockResolvedValue(null);

      const res = await certificateGET(
        new Request("http://localhost:3000/api/certificates/CERT-MISSING"),
        { params: Promise.resolve({ code: "CERT-MISSING" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 when test result is FAIL", async () => {
      mockPrisma.testLabRecord.findUnique.mockResolvedValue({
        serialNo: "BAD-001",
        hologramSealCode: "OBP-SEAL-FAIL",
        physicalCheckOk: true,
        pinCheckOk: false,
        canObdCheckOk: false,
        result: "FAIL",
        testedAt: new Date(),
        notes: "CAN-Bus yanıt vermedi",
        certificateCode: "CERT-FAIL-1",
        order: {
          orderNo: "SIP-999",
          invoiceNo: null,
          returnDeadlineAt: null,
          inquiry: {
            partCode: "03L 906 023 B",
            brand: "Volkswagen",
            vin: "WVWZZZ1KZBW209311",
          },
        },
      });

      const res = await certificateGET(
        new Request("http://localhost:3000/api/certificates/CERT-FAIL-1"),
        { params: Promise.resolve({ code: "CERT-FAIL-1" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 with QR data URL and sanitized details when PASS", async () => {
      mockPrisma.testLabRecord.findUnique.mockResolvedValue({
        serialNo: "ATE-F30-8841209",
        hologramSealCode: "OBP-SEAL-2026-8841",
        physicalCheckOk: true,
        pinCheckOk: true,
        canObdCheckOk: true,
        result: "PASS",
        testedAt: new Date("2026-11-22T14:00:00Z"),
        notes: "CAN-Bus %100 başarılı",
        certificateCode: "CERT-OBP-202603",
        order: {
          orderNo: "SIP-202603",
          invoiceNo: "OBPF2026482190",
          returnDeadlineAt: new Date("2026-12-07T10:00:00Z"),
          supplier: { companyName: "Gizli Tedarikçi" },
          purchasePrice: 9400,
          inquiry: {
            partCode: "3451 6864 677",
            brand: "BMW",
            vin: "WBA3D310X0J554120",
          },
        },
      });

      const res = await certificateGET(
        new Request("http://localhost:3000/api/certificates/CERT-OBP-202603"),
        { params: Promise.resolve({ code: "CERT-OBP-202603" }) }
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.certificate.certificateCode).toBe("CERT-OBP-202603");
      expect(json.certificate.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(json.certificate.orderNo).toBe("SIP-202603");
      expect(json.certificate).not.toHaveProperty("supplier");
      expect(json.certificate).not.toHaveProperty("purchasePrice");
    });
  });
});
