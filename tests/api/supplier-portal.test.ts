import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireRole, mockPrisma } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
  mockPrisma: {
    inquiry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    supplierOffer: {
      upsert: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    supplierProfile: {
      findUnique: vi.fn(),
    },
    supplierLedgerEntry: {
      findMany: vi.fn(),
    },
    notificationLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { GET as getRfqs } from "@/app/api/supplier/rfqs/route";
import { POST as postOffer } from "@/app/api/supplier/offers/route";
import { GET as getOrders } from "@/app/api/supplier/orders/route";
import { POST as shipOrder } from "@/app/api/supplier/orders/[id]/ship/route";
import { GET as getLedger } from "@/app/api/supplier/ledger/route";

const SUPPLIER_SESSION = {
  user: {
    userId: "user-sup-1",
    email: "tedarikci@example.com",
    fullName: "Yıldız Oto Beyin",
    role: "SUPPLIER" as const,
    supplierId: "sup-1",
  },
};

describe("Supplier Portal APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(SUPPLIER_SESSION);
  });

  describe("RBAC & Authentication", () => {
    it("returns 401 when unauthenticated across all supplier endpoints", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Oturum açmanız gerekiyor.",
        status: 401,
      });

      const rfqRes = await getRfqs();
      expect(rfqRes.status).toBe(401);

      const offerRes = await postOffer(
        new Request("http://localhost/api/supplier/offers", {
          method: "POST",
          body: JSON.stringify({}),
        })
      );
      expect(offerRes.status).toBe(401);

      const ordersRes = await getOrders();
      expect(ordersRes.status).toBe(401);

      const shipRes = await shipOrder(
        new Request("http://localhost/api/supplier/orders/ord-1/ship", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "ord-1" }) }
      );
      expect(shipRes.status).toBe(401);

      const ledgerRes = await getLedger();
      expect(ledgerRes.status).toBe(401);
    });

    it("returns 403 for non-SUPPLIER role or missing supplierId", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Bu işlem için yetkiniz bulunmuyor.",
        status: 403,
      });

      const rfqRes = await getRfqs();
      expect(rfqRes.status).toBe(403);
      expect(mockRequireRole).toHaveBeenCalledWith(["SUPPLIER"]);

      mockRequireRole.mockResolvedValue({
        user: {
          ...SUPPLIER_SESSION.user,
          supplierId: null,
        },
      });

      const ledgerRes = await getLedger();
      expect(ledgerRes.status).toBe(403);
    });
  });

  describe("GET /api/supplier/rfqs", () => {
    it("returns sanitized RFQs and strips customer PII and margin fields", async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([
        {
          id: "inq-1",
          code: "TLP-2026-001",
          partCode: "A646 150 00 00",
          vin: "WDF63960313482910",
          decodedVehicleJson: { brand: "Mercedes-Benz", modelYear: 2012 },
          category: "ECU",
          brand: "Mercedes-Benz",
          note: "Acil motor beyni",
          status: "BROADCASTED",
          broadcastedAt: new Date("2026-11-20T10:00:00Z"),
          createdAt: new Date("2026-11-20T09:00:00Z"),
          // Simulate accidental PII leakage from underlying query/mock
          customerName: "Ahmet Yılmaz",
          customerPhone: "+905551234567",
          customerEmail: "ahmet@example.com",
          deliveryAddress: "İstanbul Kadıköy",
          customerOfferPrice: 9750,
          marginPercent: 22,
          netProfit: 1400,
          offers: [
            {
              id: "off-1",
              inquiryId: "inq-1",
              supplierId: "sup-1",
              purchasePrice: 8000,
              shippingDays: 1,
              conditionNote: "Test edilmiş temiz çıkma",
              photoUrl: null,
              status: "PENDING",
              createdAt: new Date("2026-11-20T11:00:00Z"),
              updatedAt: new Date("2026-11-20T11:00:00Z"),
            },
          ],
        },
      ]);

      const res = await getRfqs();
      expect(res.status).toBe(200);

      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ["BROADCASTED", "QUOTES_RECEIVED"] } },
          orderBy: { createdAt: "desc" },
        })
      );

      const data = await res.json();
      expect(data.rfqs).toHaveLength(1);
      const rfq = data.rfqs[0];

      expect(rfq.id).toBe("inq-1");
      expect(rfq.code).toBe("TLP-2026-001");
      expect(rfq.partCode).toBe("A646 150 00 00");
      expect(rfq.myOffer).toMatchObject({
        id: "off-1",
        purchasePrice: 8000,
      });

      expect(rfq).not.toHaveProperty("customerName");
      expect(rfq).not.toHaveProperty("customerPhone");
      expect(rfq).not.toHaveProperty("customerEmail");
      expect(rfq).not.toHaveProperty("deliveryAddress");
      expect(rfq).not.toHaveProperty("customerOfferPrice");
      expect(rfq).not.toHaveProperty("marginPercent");
      expect(rfq).not.toHaveProperty("netProfit");
      expect(rfq).not.toHaveProperty("offers");
    });
  });

  describe("POST /api/supplier/offers", () => {
    it("validates purchasePrice > 0 and rejects invalid payloads with 400", async () => {
      const zeroPriceRes = await postOffer(
        new Request("http://localhost/api/supplier/offers", {
          method: "POST",
          body: JSON.stringify({
            inquiryId: "inq-1",
            purchasePrice: 0,
            shippingDays: 2,
            conditionNote: "Sağlam parça",
          }),
        })
      );
      expect(zeroPriceRes.status).toBe(400);

      const negativePriceRes = await postOffer(
        new Request("http://localhost/api/supplier/offers", {
          method: "POST",
          body: JSON.stringify({
            inquiryId: "inq-1",
            purchasePrice: -500,
            conditionNote: "Sağlam parça",
          }),
        })
      );
      expect(negativePriceRes.status).toBe(400);
      expect(mockPrisma.supplierOffer.upsert).not.toHaveBeenCalled();
    });

    it("upserts offer and transitions BROADCASTED inquiry to QUOTES_RECEIVED", async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue({
        id: "inq-1",
        status: "BROADCASTED",
      });
      mockPrisma.supplierOffer.upsert.mockResolvedValue({
        id: "off-1",
        inquiryId: "inq-1",
        supplierId: "sup-1",
        purchasePrice: 7500,
        shippingDays: 1,
        conditionNote: "Orijinal sökme garantili",
        photoUrl: null,
        status: "PENDING",
      });
      mockPrisma.inquiry.update.mockResolvedValue({
        id: "inq-1",
        status: "QUOTES_RECEIVED",
      });

      const res = await postOffer(
        new Request("http://localhost/api/supplier/offers", {
          method: "POST",
          body: JSON.stringify({
            inquiryId: "inq-1",
            purchasePrice: 7500,
            conditionNote: "Orijinal sökme garantili",
          }),
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.offer.purchasePrice).toBe(7500);

      expect(mockPrisma.supplierOffer.upsert).toHaveBeenCalledWith({
        where: {
          inquiryId_supplierId: {
            inquiryId: "inq-1",
            supplierId: "sup-1",
          },
        },
        create: {
          inquiryId: "inq-1",
          supplierId: "sup-1",
          purchasePrice: 7500,
          shippingDays: 1,
          conditionNote: "Orijinal sökme garantili",
          photoUrl: null,
        },
        update: {
          purchasePrice: 7500,
          shippingDays: 1,
          conditionNote: "Orijinal sökme garantili",
          photoUrl: null,
        },
      });

      expect(mockPrisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: "inq-1" },
        data: { status: "QUOTES_RECEIVED" },
      });
    });

    it("rejects offers on closed inquiries", async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue({
        id: "inq-1",
        status: "PAID",
      });

      const res = await postOffer(
        new Request("http://localhost/api/supplier/offers", {
          method: "POST",
          body: JSON.stringify({
            inquiryId: "inq-1",
            purchasePrice: 7500,
            conditionNote: "Orijinal sökme garantili",
          }),
        })
      );

      expect(res.status).toBe(400);
      expect(mockPrisma.supplierOffer.upsert).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/supplier/orders", () => {
    it("returns supplier orders without customerPrice, netProfit, or deliveryAddress", async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: "ord-1",
          orderNo: "OBP-1001",
          purchasePrice: 8000,
          customerPrice: 9750,
          netProfit: 1400,
          deliveryAddress: "Gizli Adres",
          status: "PAID",
          inboundCargoCode: null,
          inboundTrackingNo: null,
          createdAt: new Date("2026-11-21T10:00:00Z"),
          inquiry: {
            code: "TLP-2026-001",
            partCode: "A646 150 00 00",
            brand: "Mercedes-Benz",
            category: "ECU",
            vin: "WDF63960313482910",
            customerPhone: "+905551234567",
          },
          testLabRecord: null,
        },
      ]);

      const res = await getOrders();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.orders).toHaveLength(1);
      const order = data.orders[0];

      expect(order.orderNo).toBe("OBP-1001");
      expect(order.purchasePrice).toBe(8000);
      expect(order).not.toHaveProperty("customerPrice");
      expect(order).not.toHaveProperty("netProfit");
      expect(order).not.toHaveProperty("deliveryAddress");
      expect(order.inquiry).not.toHaveProperty("customerPhone");
    });
  });

  describe("POST /api/supplier/orders/[id]/ship", () => {
    it("enforces supplier ownership and returns 403 for another supplier's order", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-99",
        orderNo: "OBP-9999",
        inquiryId: "inq-99",
        supplierId: "sup-other",
        status: "PAID",
        inboundCargoCode: null,
        inboundTrackingNo: null,
      });

      const res = await shipOrder(
        new Request("http://localhost/api/supplier/orders/ord-99/ship", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "ord-99" }) }
      );

      expect(res.status).toBe(403);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it("generates OBP-MERKEZ cargo code, updates order & inquiry, and logs notification", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        orderNo: "OBP-1001",
        inquiryId: "inq-1",
        supplierId: "sup-1",
        status: "PAID",
        inboundCargoCode: null,
        inboundTrackingNo: null,
      });

      mockPrisma.order.update.mockImplementation(async ({ data }) => ({
        id: "ord-1",
        orderNo: "OBP-1001",
        purchasePrice: 8000,
        status: data.status,
        inboundCargoCode: data.inboundCargoCode,
        inboundTrackingNo: data.inboundTrackingNo,
        createdAt: new Date("2026-11-21T10:00:00Z"),
      }));
      mockPrisma.inquiry.update.mockResolvedValue({
        id: "inq-1",
        status: "SUPPLIER_SHIPPED",
      });
      mockPrisma.notificationLog.create.mockResolvedValue({ id: "notif-1" });

      const res = await shipOrder(
        new Request("http://localhost/api/supplier/orders/ord-1/ship", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "ord-1" }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.cargoLabel.direction).toBe("INBOUND_TO_HUB");
      expect(data.cargoLabel.cargoCode).toMatch(/^OBP-MERKEZ-[A-F0-9]{6}$/);
      expect(data.order.status).toBe("SUPPLIER_SHIPPED");
      expect(data.order.inboundCargoCode).toBe(data.cargoLabel.cargoCode);

      expect(mockPrisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: "inq-1" },
        data: { status: "SUPPLIER_SHIPPED" },
      });

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: "PANEL",
          template: "SUPPLIER_SHIPPED",
          relatedInquiryId: "inq-1",
        }),
      });
    });
  });

  describe("GET /api/supplier/ledger", () => {
    it("returns supplier profile metrics and ledger entries", async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue({
        companyName: "Yıldız Oto Beyin",
        city: "İstanbul",
        district: "İkitelli",
        rating: 4.9,
        totalDelivered: 42,
        defectCount: 1,
        balance: 16500,
        specialtyBrands: ["Mercedes-Benz", "BMW"],
        isApproved: true,
      });

      mockPrisma.supplierLedgerEntry.findMany.mockResolvedValue([
        {
          id: "led-1",
          orderId: "ord-1",
          type: "CREDIT_EARNED",
          amount: 8000,
          description: "OBP-1001 Test Onaylı Hakediş",
          status: "SETTLED",
          createdAt: new Date("2026-11-22T12:00:00Z"),
        },
      ]);

      const res = await getLedger();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.profile).toEqual({
        companyName: "Yıldız Oto Beyin",
        city: "İstanbul",
        district: "İkitelli",
        rating: 4.9,
        totalDelivered: 42,
        defectCount: 1,
        balance: 16500,
        specialtyBrands: ["Mercedes-Benz", "BMW"],
        isApproved: true,
      });
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0]).toMatchObject({
        id: "led-1",
        type: "CREDIT_EARNED",
        amount: 8000,
        status: "SETTLED",
      });
    });
  });
});
