import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PartCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { normalizePartCode } from "@/lib/vin";

const importItemSchema = z.object({
  oemCode: z.string().min(3),
  hwCode: z.string().optional(),
  swCode: z.string().optional(),
  crossRefCodes: z.array(z.string()).optional(),
  category: z.nativeEnum(PartCategory).default(PartCategory.ECU),
  brand: z.string().min(2),
  model: z.string().min(2),
  yearRange: z.string().optional(),
  engineCode: z.string().optional(),
  manufacturer: z.string().min(2),
  referencePrice: z.number().positive().optional(),
  isFeatured: z.boolean().optional(),
});

type ImportItem = z.infer<typeof importItemSchema>;

const jsonImportSchema = z.object({
  items: z.array(importItemSchema).min(1).max(2000),
});

const csvImportSchema = z.object({
  csvText: z.string().min(1),
});

const VALID_CATEGORIES = new Set<string>(Object.values(PartCategory));

const CSV_HEADER_ALIASES: Record<string, string> = {
  oemcode: "oemCode",
  hwcode: "hwCode",
  swcode: "swCode",
  crossrefcodes: "crossRefCodes",
  category: "category",
  brand: "brand",
  model: "model",
  yearrange: "yearRange",
  enginecode: "engineCode",
  manufacturer: "manufacturer",
  referenceprice: "referencePrice",
  isfeatured: "isFeatured",
};

function detectCsvDelimiter(text: string): "," | ";" {
  let inQuotes = false;
  let commaCount = 0;
  let semicolonCount = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes) {
      if (ch === "\n" || ch === "\r") {
        break;
      }
      if (ch === ",") commaCount++;
      else if (ch === ";") semicolonCount++;
    }
  }

  return semicolonCount > commaCount ? ";" : ",";
}

function parseRfcCsv(rawText: string): string[][] {
  const cleaned = rawText
    .replace(/^\uFEFF/, "")
    .replace(/^(?:[ \t]*\r?\n)+/, "");
  if (!cleaned.trim()) return [];

  const delimiter = detectCsvDelimiter(cleaned);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (ch === '"') {
      if (inQuotes && cleaned[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else if (inQuotes) {
        inQuotes = false;
      } else if (currentCell.trim().length === 0) {
        currentCell = "";
        inQuotes = true;
      } else {
        currentCell += '"';
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (ch === "\r" || ch === "\n")) {
      if (ch === "\r" && cleaned[i + 1] === "\n") {
        i++;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += ch;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function parseReferencePrice(raw?: string): number | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseCategory(raw?: string): PartCategory {
  if (!raw) return PartCategory.ECU;
  const candidate = raw.trim().toUpperCase();
  return VALID_CATEGORIES.has(candidate)
    ? (candidate as PartCategory)
    : PartCategory.ECU;
}

function parseCsvToItems(csvText: string): {
  items: ImportItem[];
  skipped: number;
  headerError?: string;
} {
  const rows = parseRfcCsv(csvText);
  if (rows.length < 2) {
    return {
      items: [],
      skipped: 0,
      headerError:
        "CSV dosyasında başlık satırı ve en az bir veri satırı bulunmalıdır.",
    };
  }

  const headerIndexMap = new Map<string, number>();
  rows[0].forEach((rawHeader, index) => {
    const key = rawHeader.trim().toLowerCase().replace(/\s+/g, "");
    const canonical = CSV_HEADER_ALIASES[key];
    if (canonical && !headerIndexMap.has(canonical)) {
      headerIndexMap.set(canonical, index);
    }
  });

  const requiredHeaders = ["oemCode", "brand", "model", "manufacturer"];
  const missingHeaders = requiredHeaders.filter(
    (h) => !headerIndexMap.has(h)
  );
  if (missingHeaders.length > 0) {
    return {
      items: [],
      skipped: 0,
      headerError: `Eksik CSV başlık sütunları: ${missingHeaders.join(", ")}`,
    };
  }

  const getCell = (row: string[], field: string): string => {
    const idx = headerIndexMap.get(field);
    if (idx === undefined || idx >= row.length) return "";
    return row[idx].trim();
  };

  const items: ImportItem[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const oemCode = getCell(row, "oemCode");
    const hwCode = getCell(row, "hwCode") || undefined;
    const swCode = getCell(row, "swCode") || undefined;
    const rawCrossRefs = getCell(row, "crossRefCodes");
    const crossRefCodes = rawCrossRefs
      ? rawCrossRefs
          .split(/[|\s]+/)
          .map((code) => code.trim())
          .filter(Boolean)
      : undefined;
    const category = parseCategory(getCell(row, "category"));
    const brand = getCell(row, "brand");
    const model = getCell(row, "model");
    const yearRange = getCell(row, "yearRange") || undefined;
    const engineCode = getCell(row, "engineCode") || undefined;
    const manufacturer = getCell(row, "manufacturer");
    const referencePrice = parseReferencePrice(getCell(row, "referencePrice"));
    const rawFeatured = getCell(row, "isFeatured").toLowerCase();
    const isFeatured =
      rawFeatured === "true" || rawFeatured === "1"
        ? true
        : rawFeatured === "false" || rawFeatured === "0"
          ? false
          : undefined;

    const candidate = importItemSchema.safeParse({
      oemCode,
      hwCode,
      swCode,
      crossRefCodes,
      category,
      brand,
      model,
      yearRange,
      engineCode,
      manufacturer,
      referencePrice,
      isFeatured,
    });

    if (!candidate.success || !normalizePartCode(oemCode)) {
      skipped++;
      continue;
    }

    items.push(candidate.data);
  }

  return { items, skipped };
}

async function upsertCatalogItems(items: ImportItem[], initialSkipped = 0) {
  let inserted = 0;
  let updated = 0;
  let skipped = initialSkipped;

  for (const item of items) {
    const normalizedCode = normalizePartCode(item.oemCode);
    if (!normalizedCode) {
      skipped++;
      continue;
    }

    const crossRefs = Array.from(
      new Set([
        normalizedCode,
        ...(item.hwCode ? [normalizePartCode(item.hwCode)] : []),
        ...(item.crossRefCodes ?? []).map(normalizePartCode),
      ])
    ).filter(Boolean);

    const existing = await prisma.catalogPart.findFirst({
      where: { normalizedCode },
    });

    if (existing) {
      await prisma.catalogPart.update({
        where: { id: existing.id },
        data: {
          oemCode: item.oemCode,
          hwCode: item.hwCode ?? existing.hwCode,
          swCode: item.swCode ?? existing.swCode,
          crossRefCodes: Array.from(
            new Set([...existing.crossRefCodes, ...crossRefs])
          ),
          category: item.category,
          brand: item.brand,
          model: item.model,
          yearRange: item.yearRange ?? existing.yearRange,
          engineCode: item.engineCode ?? existing.engineCode,
          manufacturer: item.manufacturer,
          referencePrice: item.referencePrice ?? existing.referencePrice,
          isFeatured: item.isFeatured ?? existing.isFeatured,
        },
      });
      updated++;
    } else {
      await prisma.catalogPart.create({
        data: {
          oemCode: item.oemCode,
          normalizedCode,
          hwCode: item.hwCode,
          swCode: item.swCode,
          crossRefCodes: crossRefs,
          category: item.category,
          brand: item.brand,
          model: item.model,
          yearRange: item.yearRange,
          engineCode: item.engineCode,
          manufacturer: item.manufacturer,
          referencePrice: item.referencePrice,
          isFeatured: item.isFeatured ?? false,
        },
      });
      inserted++;
    }
  }

  const total = await prisma.catalogPart.count();
  return { inserted, updated, skipped, total };
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  if (body && typeof body === "object" && "csvText" in body) {
    const parsedCsv = csvImportSchema.safeParse(body);
    if (!parsedCsv.success) {
      return NextResponse.json(
        {
          error: "CSV içe aktarma verisi geçersiz.",
          details: parsedCsv.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { items, skipped, headerError } = parseCsvToItems(
      parsedCsv.data.csvText
    );
    if (headerError) {
      return NextResponse.json({ error: headerError }, { status: 400 });
    }
    if (items.length > 2000) {
      return NextResponse.json(
        { error: "Tek seferde en fazla 2000 parça içe aktarılabilir." },
        { status: 400 }
      );
    }

    const result = await upsertCatalogItems(items, skipped);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  }

  const parsedJson = jsonImportSchema.safeParse(body);
  if (!parsedJson.success) {
    return NextResponse.json(
      {
        error: "İçe aktarma verisi geçersiz.",
        details: parsedJson.error.flatten(),
      },
      { status: 400 }
    );
  }

  const result = await upsertCatalogItems(parsedJson.data.items, 0);
  return NextResponse.json({
    ok: true,
    ...result,
  });
}
