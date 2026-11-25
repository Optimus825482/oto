import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireRole, mockPrisma } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
  mockPrisma: {
    inquiry: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    supplierProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    supplierOffer: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    testLabRecord: {
      count: vi.fn(),
      upsert: vi.fn(),
    },
    supplierLedgerEntry: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    notificationLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    catalogPart: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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

import { GET as getDashboard } from "@/app/api/admin/dashboard/route";
import { GET as getInquiries } from "@/app/api/admin/inquiries/route";
import { POST as broadcastInquiry } from "@/app/api/admin/inquiries/[id]/broadcast/route";
import { POST as selectOffer } from "@/app/api/admin/inquiries/[id]/select-offer/route";
import { GET as getOrders } from "@/app/api/admin/orders/route";
import { POST as submitTestLab } from "@/app/api/admin/orders/[id]/test-lab/route";
import { POST as issueInvoice } from "@/app/api/admin/orders/[id]/invoice/route";
import { POST as shipCustomer } from "@/app/api/admin/orders/[id]/ship-customer/route";
import { POST as payoutSupplier } from "@/app/api/admin/suppliers/[id]/payout/route";
import { POST as createCatalogPart } from "@/app/api/admin/catalog/route";

describe("Admin Operations APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RBAC enforcement", () => {
    it("rejects unauthenticated requests with 401", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Oturum açmanız gerekiyor.",
        status: 401,
      });

      const res = await getInquiries();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("rejects SUPPLIER role with 403 across admin & test-lab routes", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Bu işlem için yetkiniz bulunmuyor.",
        status: 403,
      });

      const dashRes = await getDashboard();
      expect(dashRes.status).toBe(403);
      expect(mockRequireRole).toHaveBeenCalledWith([
        "ADMIN",
        "OPERATOR",
        "TECHNICIAN",
      ]);

      const ordersRes = await getOrders();
      expect(ordersRes.status).toBe(403);

      const labReq = new Request("http://localhost/api/admin/orders/ord-1/test-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const labRes = await submitTestLab(labReq, {
        params: Promise.resolve({ id: "ord-1" }),
      });
      expect(labRes.status).toBe(403);
      expect(mockRequireRole).toHaveBeenLastCalledWith([
        "ADMIN",
        "OPERATOR",
        "TECHNICIAN",
      ]);
    });
  });

  describe("Broadcast RFQ", () => {
    it("updates inquiry status to BROADCASTED and logs WhatsApp notification", async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          userId: "admin-1",
          email: "admin@otobeyinpazari.com",
          fullName: "Admin",
          role: "ADMIN",
        },
      });

      mockPrisma.inquiry.findUnique.mockResolvedValue({
        id: "inq-1",
        code: "OBP-202601",
        brand: "Mercedes-Benz",
        partCode: "A646 150 00 00",
        category: "ECU",
      });

      mockPrisma.supplierProfile.findMany.mockResolvedValue([
        {
          id: "sup-1",
          companyName: "Ostim Oto",
          specialtyBrands: ["Mercedes-Benz", "BMW"],
          isApproved: true,
        },
        {
          id: "sup-2",
          companyName: "Bursa VAG",
          specialtyBrands: ["Volkswagen", "Audi"],
          isApproved: true,
        },
      ]);

      mockPrisma.inquiry.update.mockResolvedValue({
        id: "inq-1",
        code: "OBP-202601",
        status: "BROADCASTED",
      });

      mockPrisma.notificationLog.create.mockResolvedValue({ id: "notif-1" });

      const req = new Request("http://localhost/api/admin/inquiries/inq-1/broadcast", {
        method: "POST",
      });
      const res = await broadcastInquiry(req, {
        params: Promise.resolve({ id: "inq-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.inquiry.status).toBe("BROADCASTED");
      expect(data.notifiedSupplierCount).toBe(1);

      expect(mockPrisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: "inq-1" },
        data: expect.objectContaining({
          status: "BROADCASTED",
          broadcastedAt: expect.any(Date),
        }),
      });

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: "WHATSAPP",
          template: "RFQ_BROADCAST",
          relatedInquiryId: "inq-1",
        }),
      });
    });
  });

  describe("Select Offer & Customer Quote", () => {
    it("calculates 22% margin price, updates offers & inquiry, and logs SMS preview", async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          userId: "admin-1",
          email: "admin@otobeyinpazari.com",
          fullName: "Admin",
          role: "ADMIN",
        },
      });

      mockPrisma.inquiry.findUnique.mockResolvedValue({
        id: "inq-1",
        code: "OBP-202601",
        partCode: "A646 150 00 00",
        customerPhone: "0532 614 48 91",
      });

      mockPrisma.supplierOffer.findFirst.mockResolvedValue({
        id: "offer-1",
        inquiryId: "inq-1",
        supplierId: "sup-1",
        purchasePrice: 8000,
      });

      mockPrisma.supplierOffer.update.mockResolvedValue({
        id: "offer-1",
        status: "ACCEPTED",
      });
      mockPrisma.supplierOffer.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.inquiry.update.mockImplementation(async ({ data }) => ({
        id: "inq-1",
        code: "OBP-202601",
        ...data,
      }));
      mockPrisma.notificationLog.create.mockResolvedValue({ id: "notif-2" });

      const req = new Request(
        "http://localhost/api/admin/inquiries/inq-1/select-offer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId: "offer-1", marginPercent: 22 }),
        }
      );

      const res = await selectOffer(req, {
        params: Promise.resolve({ id: "inq-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      // 8000 * 1.22 = 9760 -> rounded to nearest 50 = 9750
      expect(data.pricing.customerPrice).toBe(9750);
      expect(data.pricing.netProfit).toBe(1400);
      expect(data.inquiry.status).toBe("OFFER_SENT");
      expect(data.inquiry.customerOfferPrice).toBe(9750);
      expect(data.offerUrl).toContain("/teklif/");
      expect(data.smsPreview).toContain("A646 150 00 00");
      expect(data.smsPreview).toContain("9.750");

      expect(mockPrisma.supplierOffer.update).toHaveBeenCalledWith({
        where: { id: "offer-1" },
        data: { status: "ACCEPTED" },
      });
      expect(mockPrisma.supplierOffer.updateMany).toHaveBeenCalledWith({
        where: { inquiryId: "inq-1", id: { not: "offer-1" } },
        data: { status: "REJECTED" },
      });
      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: "SMS",
          recipient: "0532 614 48 91",
          template: "CUSTOMER_QUOTE",
          relatedInquiryId: "inq-1",
        }),
      });
    });
  });

  describe("Test Lab Quality Gate", () => {
    it("PASS generates CERT-... certificate, credits supplier ledger, and auto-learns catalog part", async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          userId: "tech-1",
          email: "lab@otobeyinpazari.com",
          fullName: "Mehmet Demir",
          role: "TECHNICIAN",
        },
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        orderNo: "SIP-202604",
        inquiryId: "inq-4",
        supplierId: "sup-2",
        purchasePrice: 6200,
        customerPrice: 8200,
        inquiry: {
          id: "inq-4",
          code: "OBP-202604",
          partCode: "SID307 237101234R",
          category: "ECU",
          brand: "Renault",
        },
        supplier: { id: "sup-2", rating: 4.7 },
      });

      mockPrisma.testLabRecord.upsert.mockImplementation(async ({ create }) => ({
        id: "test-1",
        ...create,
      }));
      mockPrisma.order.update.mockResolvedValue({ id: "ord-1", status: "TEST_PASSED" });
      mockPrisma.inquiry.update.mockResolvedValue({ id: "inq-4", status: "TEST_PASSED" });
      mockPrisma.supplierLedgerEntry.create.mockResolvedValue({ id: "led-1" });
      mockPrisma.supplierProfile.update.mockResolvedValue({ id: "sup-2" });
      mockPrisma.catalogPart.findFirst.mockResolvedValue(null);
      mockPrisma.catalogPart.create.mockResolvedValue({ id: "part-auto-1" });

      const req = new Request("http://localhost/api/admin/orders/ord-1/test-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo: "SID307-99102",
          hologramSealCode: "OBP-SEAL-99102",
          physicalCheckOk: true,
          pinCheckOk: true,
          canObdCheckOk: true,
          result: "PASS",
          notes: "Tezgah testi başarılı",
        }),
      });

      const res = await submitTestLab(req, {
        params: Promise.resolve({ id: "ord-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.orderStatus).toBe("TEST_PASSED");
      expect(data.testRecord.certificateCode).toBe("CERT-OBP-202604");
      expect(data.autoLearnedPart).toBe(true);

      expect(mockPrisma.supplierLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supplierId: "sup-2",
          orderId: "ord-1",
          type: "CREDIT_EARNED",
          amount: 6200,
          status: "PENDING",
        }),
      });

      expect(mockPrisma.supplierProfile.update).toHaveBeenCalledWith({
        where: { id: "sup-2" },
        data: {
          balance: { increment: 6200 },
          totalDelivered: { increment: 1 },
        },
      });

      expect(mockPrisma.catalogPart.findFirst).toHaveBeenCalledWith({
        where: { normalizedCode: "SID307237101234R" },
      });
      expect(mockPrisma.catalogPart.create).toHaveBeenCalledWith({
        data: {
          oemCode: "SID307 237101234R",
          normalizedCode: "SID307237101234R",
          crossRefCodes: ["SID307237101234R"],
          category: "ECU",
          brand: "Renault",
          model: "Test Onaylı Tedarik Arşivi",
          manufacturer: "OEM / Test Onaylı",
          referencePrice: 8200,
          isFeatured: false,
        },
      });
    });

    it("PASS does NOT duplicate catalog part when normalizedCode already exists", async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          userId: "tech-1",
          email: "lab@otobeyinpazari.com",
          fullName: "Mehmet Demir",
          role: "TECHNICIAN",
        },
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-2",
        orderNo: "SIP-202605",
        inquiryId: "inq-5",
        supplierId: "sup-2",
        purchasePrice: 6200,
        customerPrice: 8200,
        inquiry: {
          id: "inq-5",
          code: "OBP-202605",
          partCode: "SID307 237101234R",
          category: "ECU",
          brand: "Renault",
        },
        supplier: { id: "sup-2", rating: 4.7 },
      });

      mockPrisma.testLabRecord.upsert.mockImplementation(async ({ create }) => ({
        id: "test-2",
        ...create,
      }));
      mockPrisma.order.update.mockResolvedValue({ id: "ord-2", status: "TEST_PASSED" });
      mockPrisma.inquiry.update.mockResolvedValue({ id: "inq-5", status: "TEST_PASSED" });
      mockPrisma.supplierLedgerEntry.create.mockResolvedValue({ id: "led-2" });
      mockPrisma.supplierProfile.update.mockResolvedValue({ id: "sup-2" });
      mockPrisma.catalogPart.findFirst.mockResolvedValue({ id: "existing-part-1" });

      const req = new Request("http://localhost/api/admin/orders/ord-2/test-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo: "SID307-99103",
          hologramSealCode: "OBP-SEAL-99103",
          physicalCheckOk: true,
          pinCheckOk: true,
          canObdCheckOk: true,
          result: "PASS",
        }),
      });

      const res = await submitTestLab(req, {
        params: Promise.resolve({ id: "ord-2" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.autoLearnedPart).toBe(false);
      expect(mockPrisma.catalogPart.create).not.toHaveBeenCalled();
    });

    it("FAIL does NOT generate certificate, does NOT credit supplier ledger, and does NOT create catalog part", async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          userId: "tech-1",
          email: "lab@otobeyinpazari.com",
          fullName: "Mehmet Demir",
          role: "TECHNICIAN",
        },
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        orderNo: "SIP-202604",
        inquiryId: "inq-4",
        supplierId: "sup-2",
        purchasePrice: 6200,
        customerPrice: 8200,
        inquiry: {
          id: "inq-4",
          code: "OBP-202604",
          partCode: "SID307 237101234R",
          category: "ECU",
          brand: "Renault",
        },
        supplier: { id: "sup-2", rating: 4.7 },
      });

      mockPrisma.testLabRecord.upsert.mockImplementation(async ({ create }) => ({
        id: "test-1",
        ...create,
      }));
      mockPrisma.order.update.mockResolvedValue({ id: "ord-1", status: "TEST_FAILED" });
      mockPrisma.inquiry.update.mockResolvedValue({ id: "inq-4", status: "TEST_FAILED" });
      mockPrisma.supplierProfile.update.mockResolvedValue({ id: "sup-2" });

      const req = new Request("http://localhost/api/admin/orders/ord-1/test-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo: "SID307-99102",
          hologramSealCode: "OBP-SEAL-99102",
          physicalCheckOk: true,
          pinCheckOk: false,
          canObdCheckOk: false,
          result: "FAIL",
          notes: "CAN-Bus iletişim hatası",
        }),
      });

      const res = await submitTestLab(req, {
        params: Promise.resolve({ id: "ord-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.orderStatus).toBe("TEST_FAILED");
      expect(data.testRecord.certificateCode).toBeNull();
      expect(data.autoLearnedPart).toBe(false);

      expect(mockPrisma.supplierLedgerEntry.create).not.toHaveBeenCalled();
      expect(mockPrisma.catalogPart.create).not.toHaveBeenCalled();
      expect(mockPrisma.supplierProfile.update).toHaveBeenCalledWith({
        where: { id: "sup-2" },
        data: {
          defectCount: { increment: 1 },
          rating: 4.5,
        },
      });
    });
  });

  describe("Outbound Cargo, E-Invoice, Payout & Catalog", () => {
    it("blocks ship-customer when Test Lab has not passed", async () => {
      mockRequireRole.mockResolvedValue({
        user: { userId: "admin-1", email: "a@b.com", fullName: "A", role: "ADMIN" },
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        orderNo: "SIP-202604",
        inquiryId: "inq-4",
        testLabRecord: { result: "FAIL" },
        inquiry: { customerPhone: "0535 820 11 65" },
      });

      const req = new Request("http://localhost/api/admin/orders/ord-1/ship-customer", {
        method: "POST",
      });
      const res = await shipCustomer(req, {
        params: Promise.resolve({ id: "ord-1" }),
      });

      expect(res.status).toBe(400);
    });

    it("issues e-invoice and persists invoiceNo on order", async () => {
      mockRequireRole.mockResolvedValue({
        user: { userId: "admin-1", email: "a@b.com", fullName: "A", role: "ADMIN" },
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        orderNo: "SIP-202603",
        customerPrice: 11450,
        invoiceType: "CORPORATE",
      });
      mockPrisma.order.update.mockResolvedValue({ id: "ord-1" });

      const req = new Request("http://localhost/api/admin/orders/ord-1/invoice", {
        method: "POST",
      });
      const res = await issueInvoice(req, {
        params: Promise.resolve({ id: "ord-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.invoice.invoiceNo).toMatch(/^OBPF\d{4}\d{6}$/);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: "ord-1" },
        data: { invoiceNo: data.invoice.invoiceNo },
      });
    });

    it("settles supplier payout and updates balance", async () => {
      mockRequireRole.mockResolvedValue({
        user: { userId: "admin-1", email: "a@b.com", fullName: "A", role: "ADMIN" },
      });

      mockPrisma.supplierProfile.findUnique.mockResolvedValue({
        id: "sup-1",
        balance: 24600,
      });
      mockPrisma.supplierLedgerEntry.create.mockResolvedValue({ id: "led-pay" });
      mockPrisma.supplierLedgerEntry.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.supplierProfile.update.mockResolvedValue({
        id: "sup-1",
        balance: 14600,
      });

      const req = new Request("http://localhost/api/admin/suppliers/sup-1/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10000 }),
      });
      const res = await payoutSupplier(req, {
        params: Promise.resolve({ id: "sup-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.paidAmount).toBe(10000);
      expect(data.remainingBalance).toBe(14600);
    });

    it("creates catalog part with normalized codes", async () => {
      mockRequireRole.mockResolvedValue({
        user: { userId: "admin-1", email: "a@b.com", fullName: "A", role: "ADMIN" },
      });

      mockPrisma.catalogPart.create.mockImplementation(async ({ data }) => ({
        id: "part-1",
        ...data,
      }));

      const req = new Request("http://localhost/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oemCode: "A 646 150 00 00",
          crossRefCodes: ["0281-015 053", "edc16cp31"],
          category: "ECU",
          brand: "Mercedes-Benz",
          model: "Vito",
          manufacturer: "Bosch",
        }),
      });
      const res = await createCatalogPart(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.part.normalizedCode).toBe("A6461500000");
      expect(data.part.crossRefCodes).toEqual(["0281015053", "EDC16CP31"]);
    });
  });
});
