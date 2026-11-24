import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireRole, mockPrisma } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
  mockPrisma: {
    catalogPart: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { GET as catalogGET, POST as catalogPOST } from "@/app/api/admin/catalog/route";
import {
  PATCH as catalogPATCH,
  DELETE as catalogDELETE,
} from "@/app/api/admin/catalog/[id]/route";

const adminAuth = {
  user: {
    userId: "admin-1",
    email: "admin@otobeyin.test",
    fullName: "Admin User",
    role: "ADMIN" as const,
  },
};

describe("Admin OEM Archive Catalog APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RBAC enforcement", () => {
    it("rejects unauthenticated requests with 401 across GET, PATCH, DELETE", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Oturum açmanız gerekiyor.",
        status: 401,
      });

      const getRes = await catalogGET(
        new Request("http://localhost:3000/api/admin/catalog")
      );
      expect(getRes.status).toBe(401);
      expect(mockRequireRole).toHaveBeenCalledWith(["ADMIN", "OPERATOR"]);

      const patchRes = await catalogPATCH(
        new Request("http://localhost:3000/api/admin/catalog/part-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: true }),
        }),
        { params: Promise.resolve({ id: "part-1" }) }
      );
      expect(patchRes.status).toBe(401);

      const deleteRes = await catalogDELETE(
        new Request("http://localhost:3000/api/admin/catalog/part-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "part-1" }) }
      );
      expect(deleteRes.status).toBe(401);
    });

    it("rejects unauthorized role with 403 across GET, PATCH, DELETE", async () => {
      mockRequireRole.mockResolvedValue({
        error: "Bu işlem için yetkiniz bulunmuyor.",
        status: 403,
      });

      const getRes = await catalogGET(
        new Request("http://localhost:3000/api/admin/catalog")
      );
      expect(getRes.status).toBe(403);

      const patchRes = await catalogPATCH(
        new Request("http://localhost:3000/api/admin/catalog/part-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand: "BMW" }),
        }),
        { params: Promise.resolve({ id: "part-1" }) }
      );
      expect(patchRes.status).toBe(403);

      const deleteRes = await catalogDELETE(
        new Request("http://localhost:3000/api/admin/catalog/part-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "part-1" }) }
      );
      expect(deleteRes.status).toBe(403);
    });
  });

  describe("GET /api/admin/catalog", () => {
    it("filters by q, brand, category, manufacturer, featured and returns pagination + stats", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);

      const fakeParts = [
        {
          id: "part-1",
          oemCode: "A646 150 00 00",
          normalizedCode: "A6461500000",
          hwCode: "HW-01",
          swCode: "SW-02",
          crossRefCodes: ["0281015053"],
          category: "ECU",
          brand: "Mercedes-Benz",
          model: "Vito",
          manufacturer: "Bosch",
          isFeatured: true,
        },
      ];

      mockPrisma.catalogPart.findMany
        .mockResolvedValueOnce(fakeParts) // items
        .mockResolvedValueOnce([
          { brand: "BMW" },
          { brand: "Mercedes-Benz" },
        ]) // distinct brands
        .mockResolvedValueOnce([
          { manufacturer: "Bosch" },
          { manufacturer: "Continental" },
        ]); // distinct manufacturers

      mockPrisma.catalogPart.count
        .mockResolvedValueOnce(32) // filtered total
        .mockResolvedValueOnce(120) // totalAll
        .mockResolvedValueOnce(14); // featuredCount

      mockPrisma.catalogPart.groupBy.mockResolvedValue([
        { category: "ECU", _count: { _all: 80 } },
        { category: "TCU", _count: { _all: 40 } },
      ]);

      const req = new Request(
        "http://localhost:3000/api/admin/catalog?q=a646-150%200000&brand=Mercedes-Benz&category=ECU&manufacturer=Bos&featured=true&page=2&limit=10"
      );
      const res = await catalogGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.items).toEqual(fakeParts);
      expect(json.parts).toEqual(fakeParts);
      expect(json.total).toBe(32);
      expect(json.page).toBe(2);
      expect(json.limit).toBe(10);
      expect(json.totalPages).toBe(4);
      expect(json.stats).toEqual({
        totalAll: 120,
        featuredCount: 14,
        brandCount: 2,
        manufacturerCount: 2,
        brands: ["BMW", "Mercedes-Benz"],
        manufacturers: ["Bosch", "Continental"],
        categoryCounts: { ECU: 80, TCU: 40 },
      });

      const itemsCallArg = mockPrisma.catalogPart.findMany.mock.calls[0][0];
      expect(itemsCallArg.skip).toBe(10);
      expect(itemsCallArg.take).toBe(10);
      expect(itemsCallArg.where.brand).toEqual({
        equals: "Mercedes-Benz",
        mode: "insensitive",
      });
      expect(itemsCallArg.where.category).toBe("ECU");
      expect(itemsCallArg.where.manufacturer).toEqual({
        contains: "Bos",
        mode: "insensitive",
      });
      expect(itemsCallArg.where.isFeatured).toBe(true);
      expect(itemsCallArg.where.OR).toEqual(
        expect.arrayContaining([
          { oemCode: { contains: "a646-150 0000", mode: "insensitive" } },
          { normalizedCode: { contains: "A6461500000", mode: "insensitive" } },
          { crossRefCodes: { has: "A6461500000" } },
          { hwCode: { contains: "a646-150 0000", mode: "insensitive" } },
          { swCode: { contains: "a646-150 0000", mode: "insensitive" } },
          { brand: { contains: "a646-150 0000", mode: "insensitive" } },
          { model: { contains: "a646-150 0000", mode: "insensitive" } },
          { engineCode: { contains: "a646-150 0000", mode: "insensitive" } },
          { manufacturer: { contains: "a646-150 0000", mode: "insensitive" } },
        ])
      );
    });

    it("caps limit at 1000 for CSV export and ignores ALL filters", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.catalogPart.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.catalogPart.groupBy.mockResolvedValue([]);

      const req = new Request(
        "http://localhost:3000/api/admin/catalog?brand=ALL&category=ALL&manufacturer=ALL&limit=5000"
      );
      const res = await catalogGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.limit).toBe(1000);
      expect(json.page).toBe(1);
      expect(json.totalPages).toBe(1);

      const itemsCallArg = mockPrisma.catalogPart.findMany.mock.calls[0][0];
      expect(itemsCallArg.take).toBe(1000);
      expect(itemsCallArg.where).toEqual({});
    });
  });

  describe("POST /api/admin/catalog", () => {
    it("creates a catalog part with normalized codes", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.create.mockImplementation(async ({ data }) => ({
        id: "part-created",
        ...data,
      }));

      const req = new Request("http://localhost:3000/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oemCode: "0AM 927 769 D",
          crossRefCodes: ["0am-927 769 g"],
          category: "TCU",
          brand: "Volkswagen",
          model: "Passat",
          manufacturer: "LuK",
          referencePrice: 13500,
        }),
      });

      const res = await catalogPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.part.normalizedCode).toBe("0AM927769D");
      expect(json.part.crossRefCodes).toEqual(["0AM927769G"]);
    });
  });

  describe("PATCH /api/admin/catalog/[id]", () => {
    it("returns 404 when catalog part does not exist", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.findUnique.mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/admin/catalog/missing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: true }),
      });

      const res = await catalogPATCH(req, {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
    });

    it("updates fields, recomputes normalizedCode and crossRefCodes, and toggles isFeatured", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.findUnique.mockResolvedValue({
        id: "part-1",
        oemCode: "A646 150 00 00",
        normalizedCode: "A6461500000",
        isFeatured: false,
      });
      mockPrisma.catalogPart.update.mockImplementation(async ({ data }) => ({
        id: "part-1",
        ...data,
      }));

      const req = new Request("http://localhost:3000/api/admin/catalog/part-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oemCode: "a 646-150 99 99",
          crossRefCodes: ["0281-015 053", "0281015053", "edc16cp31"],
          referencePrice: 15900,
          isFeatured: true,
        }),
      });

      const res = await catalogPATCH(req, {
        params: Promise.resolve({ id: "part-1" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.part.oemCode).toBe("a 646-150 99 99");
      expect(json.part.normalizedCode).toBe("A6461509999");
      expect(json.part.crossRefCodes).toEqual(["0281015053", "EDC16CP31"]);
      expect(json.part.referencePrice).toBe(15900);
      expect(json.part.isFeatured).toBe(true);
    });

    it("returns 400 when payload has invalid field", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);

      const req = new Request("http://localhost:3000/api/admin/catalog/part-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referencePrice: -100 }),
      });

      const res = await catalogPATCH(req, {
        params: Promise.resolve({ id: "part-1" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/admin/catalog/[id]", () => {
    it("returns 404 when catalog part does not exist", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.findUnique.mockResolvedValue(null);

      const res = await catalogDELETE(
        new Request("http://localhost:3000/api/admin/catalog/missing", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "missing" }) }
      );
      expect(res.status).toBe(404);
    });

    it("deletes catalog part and returns { ok: true }", async () => {
      mockRequireRole.mockResolvedValue(adminAuth);
      mockPrisma.catalogPart.findUnique.mockResolvedValue({ id: "part-1" });
      mockPrisma.catalogPart.delete.mockResolvedValue({ id: "part-1" });

      const res = await catalogDELETE(
        new Request("http://localhost:3000/api/admin/catalog/part-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "part-1" }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ ok: true });
      expect(mockPrisma.catalogPart.delete).toHaveBeenCalledWith({
        where: { id: "part-1" },
      });
    });
  });
});
