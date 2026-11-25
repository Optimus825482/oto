import { PrismaClient, PartCategory, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizePartCode } from "../src/lib/vin";

const prisma = new PrismaClient();

async function main() {
  console.log("OtoBeyinPazari seed başlatılıyor...");

  const adminPass = await bcrypt.hash("Admin123!", 10);
  const techPass = await bcrypt.hash("Lab123!", 10);
  const supplierPass = await bcrypt.hash("Tedarik123!", 10);

  // 1. Admin & Lab Technician
  const admin = await prisma.user.upsert({
    where: { email: "admin@otobeyinpazari.com" },
    update: {},
    create: {
      email: "admin@otobeyinpazari.com",
      passwordHash: adminPass,
      fullName: "Operasyon Yöneticisi",
      phone: "0850 300 45 00",
      role: UserRole.ADMIN,
    },
  });

  const technician = await prisma.user.upsert({
    where: { email: "lab@otobeyinpazari.com" },
    update: {},
    create: {
      email: "lab@otobeyinpazari.com",
      passwordHash: techPass,
      fullName: "Mehmet Demir (Baş Teknisyen)",
      phone: "0532 100 20 30",
      role: UserRole.TECHNICIAN,
    },
  });

  // 2. 4 Approved Suppliers
  const supplierSeeds = [
    {
      email: "tedarikci1@otobeyinpazari.com",
      fullName: "Ahmet Yılmaz",
      phone: "0533 211 44 14",
      companyName: "Ostim Oto Elektronik A.Ş.",
      city: "Ankara",
      district: "Ostim",
      specialtyBrands: ["Mercedes-Benz", "BMW", "Audi"],
      rating: 4.9,
      totalDelivered: 48,
      defectCount: 1,
      balance: 24600,
    },
    {
      email: "tedarikci2@otobeyinpazari.com",
      fullName: "Hasan Kaya",
      phone: "0532 455 77 07",
      companyName: "İkitelli Beyin Merkezi",
      city: "İstanbul",
      district: "İkitelli",
      specialtyBrands: ["Mercedes-Benz", "Volkswagen", "Ford", "Renault"],
      rating: 4.7,
      totalDelivered: 35,
      defectCount: 2,
      balance: 16400,
    },
    {
      email: "tedarikci3@otobeyinpazari.com",
      fullName: "Murat Çelik",
      phone: "0542 612 88 29",
      companyName: "Ege ECU & Mekatronik",
      city: "İzmir",
      district: "3. Sanayi",
      specialtyBrands: ["Mercedes-Benz", "Volkswagen", "BMW", "Opel"],
      rating: 4.8,
      totalDelivered: 41,
      defectCount: 1,
      balance: 19800,
    },
    {
      email: "tedarikci4@otobeyinpazari.com",
      fullName: "Kemal Aydın",
      phone: "0505 890 33 03",
      companyName: "Bursa VAG & DSG Elektronik",
      city: "Bursa",
      district: "Küçük Sanayi",
      specialtyBrands: ["Volkswagen", "Audi", "Škoda", "SEAT", "Fiat"],
      rating: 4.9,
      totalDelivered: 52,
      defectCount: 0,
      balance: 31200,
    },
  ];

  const suppliers = [];
  for (const s of supplierSeeds) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: supplierPass,
        fullName: s.fullName,
        phone: s.phone,
        role: UserRole.SUPPLIER,
      },
    });

    const profile = await prisma.supplierProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: s.companyName,
        city: s.city,
        district: s.district,
        specialtyBrands: s.specialtyBrands,
        rating: s.rating,
        totalDelivered: s.totalDelivered,
        defectCount: s.defectCount,
        balance: s.balance,
        isApproved: true,
      },
    });
    suppliers.push(profile);
  }

  // 3. 12 Realistic Catalog Parts with OEM / HW / SW Cross-References
  const catalogSeeds = [
    {
      oemCode: "A646 150 00 00",
      hwCode: "0281 015 053",
      swCode: "1037391214",
      crossRefCodes: ["A6461500000", "0281015053", "EDC16CP31"],
      category: PartCategory.ECU,
      brand: "Mercedes-Benz",
      model: "Vito / Sprinter 2.2 CDI",
      yearRange: "2006-2014",
      engineCode: "OM646",
      manufacturer: "Bosch",
      referencePrice: 9900,
      isFeatured: true,
    },
    {
      oemCode: "A 274 900 16 00",
      hwCode: "A2749010500",
      swCode: "MED17.7.2",
      crossRefCodes: ["A2749001600", "0261S10492", "MED1772"],
      category: PartCategory.ECU,
      brand: "Mercedes-Benz",
      model: "CLA / GLA / C180 / E180",
      yearRange: "2013-2019",
      engineCode: "M274",
      manufacturer: "Bosch",
      referencePrice: 14500,
      isFeatured: true,
    },
    {
      oemCode: "A 642 150 08 72",
      hwCode: "0281 013 721",
      swCode: "CR4.30",
      crossRefCodes: ["A6421500872", "0281013721", "OM642"],
      category: PartCategory.ECU,
      brand: "Mercedes-Benz",
      model: "Sprinter / Vito V6 3.0 CDI",
      yearRange: "2007-2015",
      engineCode: "OM642",
      manufacturer: "Bosch",
      referencePrice: 12800,
      isFeatured: true,
    },
    {
      oemCode: "A 647 153 28 79",
      hwCode: "0281 012 066",
      swCode: "CR3.41",
      crossRefCodes: ["A6471532879", "0281012066"],
      category: PartCategory.ECU,
      brand: "Mercedes-Benz",
      model: "Vito / Sprinter / Viano",
      yearRange: "2004-2010",
      engineCode: "OM647",
      manufacturer: "Bosch",
      referencePrice: 8900,
      isFeatured: true,
    },
    {
      oemCode: "0AM 927 769 D",
      hwCode: "0AM927769K",
      swCode: "DQ200-GEN1",
      crossRefCodes: ["0AM927769D", "0AM927769K", "DQ200"],
      category: PartCategory.TCU,
      brand: "Volkswagen",
      model: "Golf / Passat / Polo / Caddy DSG 7",
      yearRange: "2009-2018",
      engineCode: "1.6 TDI / 1.4 TSI",
      manufacturer: "Continental",
      referencePrice: 14200,
      isFeatured: true,
    },
    {
      oemCode: "3451 6864 677",
      hwCode: "10.0915-0812.3",
      swCode: "DSC-MK100",
      crossRefCodes: ["34516864677", "34526864678", "MK100"],
      category: PartCategory.ABS,
      brand: "BMW",
      model: "3 Serisi F30 / 4 Serisi F32",
      yearRange: "2012-2018",
      engineCode: "N20 / N47 / B47",
      manufacturer: "ATE",
      referencePrice: 11400,
      isFeatured: true,
    },
    {
      oemCode: "03L 906 023 B",
      hwCode: "5WP42899AA",
      swCode: "SIMOS-PCR2.1",
      crossRefCodes: ["03L906023B", "PCR21", "CAYC"],
      category: PartCategory.ECU,
      brand: "Volkswagen",
      model: "Passat / Jetta / Golf 1.6 TDI",
      yearRange: "2010-2015",
      engineCode: "CAYC",
      manufacturer: "Continental / Siemens",
      referencePrice: 9400,
      isFeatured: true,
    },
    {
      oemCode: "23710 4769R",
      hwCode: "S180157104A",
      swCode: "SID307",
      crossRefCodes: ["237104769R", "SID307", "K9K"],
      category: PartCategory.ECU,
      brand: "Renault",
      model: "Megane 3 / Fluence / Clio 4 1.5 dCi",
      yearRange: "2012-2018",
      engineCode: "K9K",
      manufacturer: "Continental",
      referencePrice: 7600,
      isFeatured: true,
    },
    {
      oemCode: "51892329",
      hwCode: "MJD 8F3.B1",
      swCode: "BC.0109536.A",
      crossRefCodes: ["51892329", "MJD8F3", "55246943"],
      category: PartCategory.ECU,
      brand: "Fiat",
      model: "Doblo / Fiorino / Egea 1.3 Multijet",
      yearRange: "2011-2019",
      engineCode: "199A9000",
      manufacturer: "Magneti Marelli",
      referencePrice: 6800,
      isFeatured: false,
    },
    {
      oemCode: "BK21-12A650-AC",
      hwCode: "S180145101A",
      swCode: "SID208",
      crossRefCodes: ["BK2112A650AC", "SID208", "CC1112A650BC"],
      category: PartCategory.ECU,
      brand: "Ford",
      model: "Transit Custom / Tourneo 2.2 TDCi",
      yearRange: "2012-2017",
      engineCode: "DRFF",
      manufacturer: "Continental",
      referencePrice: 10900,
      isFeatured: false,
    },
    {
      oemCode: "9806687980",
      hwCode: "BSI-Q04-00",
      swCode: "VALEO-BSI",
      crossRefCodes: ["9806687980", "BSIQ04", "9678477180"],
      category: PartCategory.BCM,
      brand: "Peugeot",
      model: "308 / 3008 / Partner Konfor Beyni (BSI)",
      yearRange: "2014-2020",
      engineCode: "DV6",
      manufacturer: "Valeo",
      referencePrice: 6200,
      isFeatured: false,
    },
    {
      oemCode: "13589374",
      hwCode: "SDM-GM",
      swCode: "SRS-OPEL",
      crossRefCodes: ["13589374", "13591243", "SDMGM"],
      category: PartCategory.SRS,
      brand: "Opel",
      model: "Astra J / Insignia Airbag Beyni",
      yearRange: "2011-2017",
      engineCode: "A16XER / B16DTH",
      manufacturer: "ACDelco / GM",
      referencePrice: 4900,
      isFeatured: false,
    },
  ];

  const existingPartsCount = await prisma.catalogPart.count();
  if (existingPartsCount === 0) {
    for (const p of catalogSeeds) {
      await prisma.catalogPart.create({
        data: {
          ...p,
          normalizedCode: normalizePartCode(p.oemCode),
        },
      });
    }
  }

  // 4. Sample Inquiries & Orders across Lifecycle Stages
  const existingInquiries = await prisma.inquiry.count();
  if (existingInquiries === 0 && suppliers.length >= 4) {
    // Inquiry 1: QUOTES_RECEIVED (ready for Admin comparison & SMS send)
    const inq1 = await prisma.inquiry.create({
      data: {
        code: "OBP-202601",
        customerName: "Serkan Öztürk",
        customerPhone: "0532 614 48 91",
        partCode: "A646 150 00 00",
        normalizedPartCode: normalizePartCode("A646 150 00 00"),
        vin: "WDF63960313482910",
        decodedVehicleJson: {
          valid: true,
          brand: "Mercedes-Benz (Ticari)",
          region: "Almanya",
          modelYear: 2013,
        },
        category: PartCategory.ECU,
        brand: "Mercedes-Benz",
        note: "Vito 111 CDI motor beyni arızalı, testli temiz çıkma arıyorum.",
        status: "QUOTES_RECEIVED",
        broadcastedAt: new Date(Date.now() - 45 * 60 * 1000),
      },
    });

    await prisma.supplierOffer.createMany({
      data: [
        {
          inquiryId: inq1.id,
          supplierId: suppliers[0].id,
          purchasePrice: 8200,
          shippingDays: 1,
          conditionNote: "Orijinal çıkma, açılmamış etiketli • Bugün kargo",
        },
        {
          inquiryId: inq1.id,
          supplierId: suppliers[1].id,
          purchasePrice: 8750,
          shippingDays: 2,
          conditionNote: "Temiz çıkma, pinler sağlam • Yarın kargo",
        },
        {
          inquiryId: inq1.id,
          supplierId: suppliers[2].id,
          purchasePrice: 7900,
          shippingDays: 1,
          conditionNote: "Testli çıkma, görsel eklendi • Bugün kargo",
        },
      ],
    });

    // Inquiry 2: OFFER_SENT (ready for Customer to pay via /teklif/demo-dsg-2026)
    const inq2 = await prisma.inquiry.create({
      data: {
        code: "OBP-202602",
        customerName: "Emre Karahan",
        customerPhone: "0544 328 19 04",
        partCode: "0AM 927 769 D",
        normalizedPartCode: normalizePartCode("0AM 927 769 D"),
        vin: "WVWZZZ3CZEE104829",
        decodedVehicleJson: {
          valid: true,
          brand: "Volkswagen",
          region: "Almanya",
          modelYear: 2014,
        },
        category: PartCategory.TCU,
        brand: "Volkswagen",
        note: "Passat DSG 7 mekatronik kart",
        status: "OFFER_SENT",
        customerOfferPrice: 14050,
        marginPercent: 22,
        paymentToken: "demo-dsg-2026",
        broadcastedAt: new Date(Date.now() - 120 * 60 * 1000),
      },
    });

    const offer2 = await prisma.supplierOffer.create({
      data: {
        inquiryId: inq2.id,
        supplierId: suppliers[3].id,
        purchasePrice: 11500,
        shippingDays: 1,
        conditionNote: "Mekatronik kart temiz, orijinal • Bugün kargo",
        status: "ACCEPTED",
      },
    });

    await prisma.inquiry.update({
      where: { id: inq2.id },
      data: { selectedOfferId: offer2.id },
    });

    // Inquiry 3: TEST_PASSED + Order + TestLabRecord + QR Certificate (ready for /takip/OBP-202603 & /sertifika/CERT-OBP-202603)
    const inq3 = await prisma.inquiry.create({
      data: {
        code: "OBP-202603",
        customerName: "Burak Şahin (Şahin Oto Servis)",
        customerPhone: "0505 491 77 32",
        partCode: "3451 6864 677",
        normalizedPartCode: normalizePartCode("3451 6864 677"),
        vin: "WBA3D310X0J554120",
        decodedVehicleJson: {
          valid: true,
          brand: "BMW",
          region: "Almanya",
          modelYear: 2018,
        },
        category: PartCategory.ABS,
        brand: "BMW",
        status: "SHIPPED_TO_CUSTOMER",
        customerOfferPrice: 11450,
        marginPercent: 22,
        paymentToken: "paid-bmw-2026",
        broadcastedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    });

    const offer3 = await prisma.supplierOffer.create({
      data: {
        inquiryId: inq3.id,
        supplierId: suppliers[0].id,
        purchasePrice: 9400,
        shippingDays: 1,
        conditionNote: "Pompa + Elektronik komple temiz",
        status: "ACCEPTED",
      },
    });

    const order3 = await prisma.order.create({
      data: {
        orderNo: "SIP-202603",
        inquiryId: inq3.id,
        supplierId: suppliers[0].id,
        customerPrice: 11450,
        purchasePrice: 9400,
        shippingCost: 350,
        netProfit: 1700,
        paymentStatus: "ESCROW_HELD",
        paymentRef: "ESC-SIP-202603-9F2A1B",
        inboundCargoCode: "OBP-MERKEZ-4A81C2",
        inboundTrackingNo: "TR9011223344",
        outboundCargoCode: "OBP-TESLIM-7D92E4",
        outboundTrackingNo: "TR9088776655",
        deliveryAddress: "Maslak Atatürk Oto Sanayi 2. Kısım 14. Sk No:8 Sarıyer/İstanbul",
        invoiceNo: "OBPF2026482190",
        invoiceType: "CORPORATE",
        returnDeadlineAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "SHIPPED_TO_CUSTOMER",
      },
    });

    await prisma.testLabRecord.create({
      data: {
        orderId: order3.id,
        technicianId: technician.id,
        serialNo: "ATE-F30-8841209",
        hologramSealCode: "OBP-SEAL-2026-8841",
        physicalCheckOk: true,
        pinCheckOk: true,
        canObdCheckOk: true,
        result: "PASS",
        notes: "CAN-Bus haberleşme, pompa motoru ve solenoid valf tezgâh testi %100 başarılı.",
        certificateCode: "CERT-OBP-202603",
      },
    });

    await prisma.supplierLedgerEntry.create({
      data: {
        supplierId: suppliers[0].id,
        orderId: order3.id,
        type: "CREDIT_EARNED",
        amount: 9400,
        description: "SIP-202603 Test Onaylı Hakediş",
        status: "PENDING",
      },
    });

    // Inquiry 4: IN_TEST_LAB (ready for Technician to test in /admin/test-lab)
    const inq4 = await prisma.inquiry.create({
      data: {
        code: "OBP-202604",
        customerName: "Mustafa Arslan",
        customerPhone: "0535 820 11 65",
        partCode: "23710 4769R",
        normalizedPartCode: normalizePartCode("23710 4769R"),
        vin: "VF1KZ140648291033",
        decodedVehicleJson: {
          valid: true,
          brand: "Renault",
          region: "Fransa",
          modelYear: 2015,
        },
        category: PartCategory.ECU,
        brand: "Renault",
        status: "IN_TEST_LAB",
        customerOfferPrice: 7600,
        marginPercent: 22,
        paymentToken: "paid-renault-2026",
        broadcastedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    await prisma.supplierOffer.create({
      data: {
        inquiryId: inq4.id,
        supplierId: suppliers[1].id,
        purchasePrice: 6200,
        shippingDays: 1,
        conditionNote: "SID307 temiz çıkma",
        status: "ACCEPTED",
      },
    });

    await prisma.order.create({
      data: {
        orderNo: "SIP-202604",
        inquiryId: inq4.id,
        supplierId: suppliers[1].id,
        customerPrice: 7600,
        purchasePrice: 6200,
        shippingCost: 350,
        netProfit: 1050,
        paymentStatus: "ESCROW_HELD",
        paymentRef: "ESC-SIP-202604-3C71E0",
        inboundCargoCode: "OBP-MERKEZ-2B90D1",
        inboundTrackingNo: "TR9055443322",
        deliveryAddress: "Nilüfer Küçük Sanayi Sitesi 32. Blok Bursa",
        status: "IN_TEST_LAB",
      },
    });

    // Inquiry 5: BROADCASTED (visible in Supplier Portal immediately for "Bende Var")
    await prisma.inquiry.create({
      data: {
        code: "OBP-202605",
        customerName: "Hakan Yıldız",
        customerPhone: "0536 901 22 78",
        partCode: "03L 906 023 B",
        normalizedPartCode: normalizePartCode("03L 906 023 B"),
        vin: "WVWZZZ1KZBW209311",
        decodedVehicleJson: {
          valid: true,
          brand: "Volkswagen",
          region: "Almanya",
          modelYear: 2011,
        },
        category: PartCategory.ECU,
        brand: "Volkswagen",
        note: "Golf 6 1.6 TDI PCR2.1 motor beyni acil lazım.",
        status: "BROADCASTED",
        broadcastedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    await prisma.notificationLog.create({
      data: {
        channel: "WHATSAPP",
        recipient: "4 Onaylı Tedarikçi",
        template: "RFQ_BROADCAST",
        message: "Yeni Talep OBP-202605: Volkswagen 03L 906 023 B (ECU). Elinizde varsa hemen fiyat verin.",
        status: "SANDBOX_SENT",
      },
    });
  }

  console.log("Seed tamamlandı:", { admin: admin.email, suppliers: suppliers.length });
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
