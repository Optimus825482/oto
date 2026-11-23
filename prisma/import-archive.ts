import { PrismaClient, PartCategory } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { normalizePartCode } from "../src/lib/vin";

const prisma = new PrismaClient();

interface ArchiveRow {
  oemCode: string;
  hwCode?: string;
  swCode?: string;
  crossRefCodes?: string[];
  category: PartCategory;
  brand: string;
  model: string;
  yearRange?: string;
  engineCode?: string;
  manufacturer: string;
  referencePrice?: number;
  isFeatured?: boolean;
}

async function main() {
  const filePath = path.resolve(__dirname, "data", "real-ecu-archive.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows: ArchiveRow[] = JSON.parse(raw);

  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const normalizedCode = normalizePartCode(row.oemCode);
    const crossRefs = Array.from(
      new Set([
        normalizedCode,
        ...(row.hwCode ? [normalizePartCode(row.hwCode)] : []),
        ...(row.crossRefCodes ?? []).map(normalizePartCode),
      ])
    ).filter(Boolean);

    const existing = await prisma.catalogPart.findFirst({
      where: { normalizedCode },
    });

    if (existing) {
      await prisma.catalogPart.update({
        where: { id: existing.id },
        data: {
          oemCode: row.oemCode,
          hwCode: row.hwCode ?? existing.hwCode,
          swCode: row.swCode ?? existing.swCode,
          crossRefCodes: Array.from(new Set([...existing.crossRefCodes, ...crossRefs])),
          category: row.category,
          brand: row.brand,
          model: row.model,
          yearRange: row.yearRange ?? existing.yearRange,
          engineCode: row.engineCode ?? existing.engineCode,
          manufacturer: row.manufacturer,
          referencePrice: row.referencePrice ?? existing.referencePrice,
          isFeatured: row.isFeatured ?? existing.isFeatured,
        },
      });
      updated++;
    } else {
      await prisma.catalogPart.create({
        data: {
          oemCode: row.oemCode,
          normalizedCode,
          hwCode: row.hwCode,
          swCode: row.swCode,
          crossRefCodes: crossRefs,
          category: row.category,
          brand: row.brand,
          model: row.model,
          yearRange: row.yearRange,
          engineCode: row.engineCode,
          manufacturer: row.manufacturer,
          referencePrice: row.referencePrice,
          isFeatured: row.isFeatured ?? false,
        },
      });
      inserted++;
    }
  }

  const total = await prisma.catalogPart.count();
  console.log(`Gerçek OEM/ECU Arşivi aktarıldı: ${inserted} yeni eklendi, ${updated} güncellendi. Toplam katalog: ${total} parça.`);
}

main()
  .catch((err) => {
    console.error("Arşiv aktarım hatası:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
