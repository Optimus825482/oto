# OtoBeyinPazari.com Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with multi-parallel wave dispatch (disjoint file ownership per wave, `flash` model for well-specified parallel tasks to optimize token budget). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full-stack OtoBeyinPazari.com B2B2C centralized automotive ECU procurement, RFQ, test laboratory, e-invoicing, and standardized shipping platform with 3 role-based panels while preserving the existing interactive presentation at `/sunum`.

**Architecture:** Single Next.js 15 (App Router, TypeScript, Tailwind CSS) monolith backed by PostgreSQL + Prisma ORM, deployed as a standalone Coolify Docker container alongside PostgreSQL via `docker-compose.yml`. External Turkish integrations (SMS/WhatsApp, iyzico/PayTR Escrow, Anlaşmalı Kargo, E-Fatura) sit behind clean service adapters with full database-backed sandbox behavior ready for production credentials.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL 17, Zod, Jose (JWT HTTP-only cookies), bcryptjs, Lucide React, QRCode, Vitest.

**Spec:** [index.html](file:///d:/PROJELER/otobeyin/index.html) and [ui-mockup.jpg](file:///d:/PROJELER/otobeyin/assets/ui-mockup.jpg).

## Global Constraints

- Brand palette verbatim from spec: Navy `#0A2240` / `#061529`, Orange `#F57C00` / `#E06B00`, Emerald `#10B981` / `#059669`, Rose `#E11D48`, Slate neutrals; fonts `Plus Jakarta Sans` (headings) + `Inter` (body).
- UI language: 100% natural Turkish across all 3 panels, emails/SMS previews, statuses, and error messages.
- Closed supplier network (zero bypass): Customer-facing responses MUST NEVER expose supplier name, phone, city, or purchase price.
- Preserve existing presentation at `/sunum` (moving `index.html` to `public/sunum/index.html` and `assets/*` to `public/assets/*`).
- 14-day unconditional return & Escrow ("Güvence Hesabı") guarantee reflected in storefront, quote acceptance, and order records.
- Coolify-ready: Multi-stage `Dockerfile` (Next.js `output: "standalone"`) with `/api/health` returning `200 OK` and `docker-compose.yml` for PostgreSQL 17.
- Token-efficiency: Parallel subagents in Wave 1 and Wave 2 own strictly disjoint directories and run on `flash` model with concise interface-driven briefs.

## Review Focus

1. **Zero Supplier Leak:** Customer quote (`/api/offers/[token]`) and tracking (`/api/inquiries`) endpoints must strip `supplier`, `purchasePrice`, and `netProfit` fields — tested explicitly.
2. **Part Code Normalization:** Queries with spaces, hyphens, or mixed case (e.g. `a646-150 0000` vs `A646 150 00 00`) must match both primary OEM codes and `crossRefCodes`.
3. **17-Char VIN Validation & Decoding:** Invalid VIN lengths or forbidden characters (`I`, `O`, `Q`) return structured Turkish validation errors; valid 17-char VINs decode manufacturer/year cleanly.
4. **Role-Based Access Control (RBAC):** Unauthenticated or wrong-role requests to `/api/supplier/*` and `/api/admin/*` return `401`/`403`.
5. **Test Lab Fail Path:** Failing a bench test (`FAIL`) must NOT generate a valid warranty certificate or credit the supplier ledger; instead it increments `defectCount`, sets order/inquiry to `TEST_FAILED`, and keeps escrow protected.

---

## Parallel Execution Waves (DAG)

- **Wave 0 (Foundation — Sequential):** Task 1 (Scaffold + `/sunum` + Docker) → Task 2 (Prisma PostgreSQL Schema + Auth + VIN/Pricing + Adapters + Seed)
- **Wave 1 (Backend APIs — 3 Subagents in Parallel):**
  - Task 3: Public Catalog, Auth, VIN, Inquiry, Offer/Payment & Certificate APIs (`src/app/api/auth/*`, `catalog`, `vin`, `inquiries`, `offers`, `certificates`, `health`)
  - Task 4: Supplier Portal APIs (`src/app/api/supplier/*`)
  - Task 5: Admin & Test Lab APIs (`src/app/api/admin/*`)
- **Wave 2 (Frontend Panels — 3 Subagents in Parallel):**
  - Task 6: Customer Storefront, Live Tracking, Quote Payment & QR Certificate (`src/app/(storefront)/*`, `src/app/takip/*`, `src/app/teklif/*`, `src/app/sertifika/*`, `src/components/storefront/*`)
  - Task 7: Auth Login & Supplier Portal UI (`src/app/giris/*`, `src/app/tedarikci/*`, `src/components/supplier/*`)
  - Task 8: Admin & Test Operations Center UI (`src/app/admin/*`, `src/components/admin/*`)
- **Wave 3 (Verification — Sequential):** Task 9 (DB push, seed, Vitest suite, TypeScript check, production build, live smoke check)

---

### Task 1: Project Scaffold, Brand Tokens, `/sunum` Preservation & Docker Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `docker-compose.yml`, `.env.example`, `.env`
- Modify: `Dockerfile`, `.gitignore`, `.dockerignore`
- Move/Copy: `assets/*` → `public/assets/*`, `index.html` → `public/sunum/index.html`

**Interfaces:**
- Produces: Runnable Next.js 15 TypeScript + Tailwind CSS project with `@/*` path alias, `public/assets/logo-main.jpg`, `/sunum` rewrite, and Vitest test runner.

- [ ] **Step 1:** Initialize `package.json` with Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma 6, `@prisma/client`, `zod`, `jose`, `bcryptjs`, `lucide-react`, `qrcode`, `vitest`, and `tsx`; install dependencies with `npm install`.
- [ ] **Step 2:** Copy `assets/` to `public/assets/`, copy `index.html` to `public/sunum/index.html` (updating `assets/` image URLs to `/assets/`), and configure `next.config.ts` with `output: "standalone"` and rewrite `/sunum` → `/sunum/index.html`.
- [ ] **Step 3:** Create `src/app/globals.css` and `src/app/layout.tsx` loading `Inter` and `Plus Jakarta Sans` and defining OtoBeyinPazari brand variables.
- [ ] **Step 4:** Update `Dockerfile` (multi-stage Node 22 alpine standalone build + Prisma client generation + `/api/health` check) and create `docker-compose.yml` (PostgreSQL 17 + app service) and `.env.example` / `.env` pointing to local PostgreSQL (`otobeyin` DB).
- [ ] **Step 5:** Verify `npx tsc --noEmit` succeeds on base scaffold and commit.

---

### Task 2: PostgreSQL Prisma Schema, Auth/RBAC, VIN/Pricing Engine, Adapters & Seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/vin.ts`, `src/lib/pricing.ts`, `src/lib/adapters/notifications.ts`, `src/lib/adapters/payment.ts`, `src/lib/adapters/cargo.ts`, `src/lib/adapters/einvoice.ts`, `src/types/domain.ts`
- Test: `tests/lib/core.test.ts`

**Interfaces:**
- Produces:
  - Prisma client singleton `prisma` from `src/lib/db.ts`
  - `hashPassword(plain)`, `verifyPassword(plain, hash)`, `createSessionToken(payload)`, `getSessionUser()`, `requireRole(roles)` from `src/lib/auth.ts`
  - `normalizePartCode(code: string): string`, `decodeVin(vin: string): VinDecodeResult` from `src/lib/vin.ts`
  - `calculateCustomerPrice(purchasePrice: number, marginPercent: number, shippingCost?: number): PricingBreakdown` from `src/lib/pricing.ts`
  - Adapters: `sendNotification(...)`, `createEscrowPayment(...)`, `generateCargoLabel(...)`, `issueEInvoice(...)`

- [ ] **Step 1:** Write `tests/lib/core.test.ts` testing `normalizePartCode` (spaces/hyphens/case), `decodeVin` (valid Mercedes/VW/BMW VINs + invalid length/forbidden chars I/O/Q), and `calculateCustomerPrice` (22% margin, 50 TL rounding, net profit).
- [ ] **Step 2:** Author `prisma/schema.prisma` with PostgreSQL models: `User`, `SupplierProfile`, `CatalogPart`, `Inquiry`, `SupplierOffer`, `Order`, `TestLabRecord`, `SupplierLedgerEntry`, `NotificationLog`.
- [ ] **Step 3:** Implement `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/vin.ts`, `src/lib/pricing.ts`, and the 4 sandbox-ready adapters under `src/lib/adapters/`.
- [ ] **Step 4:** Create `prisma/seed.ts` with Admin (`admin@otobeyinpazari.com`), Technician (`lab@otobeyinpazari.com`), 4 Turkish Suppliers (`tedarikci1..4@otobeyinpazari.com`), 12 ECU/TCU/ABS/BCM/SRS catalog parts with cross-references, and 3 sample inquiries/orders across lifecycle stages.
- [ ] **Step 5:** Run `npx vitest run tests/lib/core.test.ts`, create `otobeyin` PostgreSQL database if needed, run `npx prisma db push && npx prisma db seed`, and commit.

---

### Task 3 (Wave 1 — Parallel Subagent A): Public Catalog, Auth, VIN, Inquiry & Payment APIs

**Files:**
- Create: `src/app/api/health/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/catalog/route.ts`, `src/app/api/vin/decode/route.ts`, `src/app/api/inquiries/route.ts`, `src/app/api/offers/[token]/route.ts`, `src/app/api/offers/[token]/pay/route.ts`, `src/app/api/certificates/[code]/route.ts`
- Test: `tests/api/public-catalog.test.ts`

**Interfaces:**
- Consumes: `prisma`, `src/lib/auth.ts`, `src/lib/vin.ts`, `src/lib/adapters/*`
- Produces:
  - `GET /api/health` → `{ ok: true, db: "connected" }`
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET /api/catalog?q=&category=&brand=` (matches `normalizedCode`, `oemCode`, `hwCode`, `swCode`, `crossRefCodes`, `brand`, `model`)
  - `POST /api/vin/decode` `{ vin }` → `VinDecodeResult`
  - `POST /api/inquiries` (creates `OBP-XXXXXX` inquiry + optional VIN decode) & `GET /api/inquiries?code=&phone=` (public sanitized tracking timeline — zero supplier info)
  - `GET /api/offers/[token]` (sanitized customer quote) & `POST /api/offers/[token]/pay` (creates Escrow `Order`, notifies supplier, generates inbound cargo code)
  - `GET /api/certificates/[code]` (returns QR verified `TestLabRecord` + sanitized order/invoice info)

- [ ] **Step 1:** Implement all route handlers with Zod validation and strict sanitization (never exposing supplier identity or purchase price).
- [ ] **Step 2:** Write `tests/api/public-catalog.test.ts` verifying part normalization search, VIN validation, inquiry creation, zero supplier leak on customer offer/tracking endpoints, and certificate lookup.
- [ ] **Step 3:** Run `npx vitest run tests/api/public-catalog.test.ts` and verify PASS.

---

### Task 4 (Wave 1 — Parallel Subagent B): Supplier Portal APIs

**Files:**
- Create: `src/app/api/supplier/rfqs/route.ts`, `src/app/api/supplier/offers/route.ts`, `src/app/api/supplier/orders/route.ts`, `src/app/api/supplier/orders/[id]/ship/route.ts`, `src/app/api/supplier/ledger/route.ts`
- Test: `tests/api/supplier-portal.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireRole(["SUPPLIER"])`, `generateCargoLabel`, `sendNotification`
- Produces:
  - `GET /api/supplier/rfqs` (broadcasted inquiries relevant to supplier's specialty brands or all active broadcasts, with supplier's own submitted offer if any — NEVER exposes customer phone/email or competing supplier offers)
  - `POST /api/supplier/offers` `{ inquiryId, purchasePrice, shippingDays, conditionNote, photoUrl? }`
  - `GET /api/supplier/orders` (orders assigned to this supplier)
  - `POST /api/supplier/orders/[id]/ship` (marks inbound shipment to OtoBeyinPazari Hub, returns/persists `inboundCargoCode` & `inboundTrackingNo`)
  - `GET /api/supplier/ledger` (profile rating, balance, `SupplierLedgerEntry[]`)

- [ ] **Step 1:** Implement all 5 supplier API routes with strict RBAC (`401`/`403` for non-suppliers) and privacy isolation (no customer contact info, no other suppliers' prices).
- [ ] **Step 2:** Write `tests/api/supplier-portal.test.ts` verifying RBAC enforcement, offer submission, inbound shipment transition, and ledger calculation.
- [ ] **Step 3:** Run `npx vitest run tests/api/supplier-portal.test.ts` and verify PASS.

---

### Task 5 (Wave 1 — Parallel Subagent C): Admin RFQ, Test Lab, Cargo, E-Invoice & Payout APIs

**Files:**
- Create: `src/app/api/admin/dashboard/route.ts`, `src/app/api/admin/inquiries/route.ts`, `src/app/api/admin/inquiries/[id]/broadcast/route.ts`, `src/app/api/admin/inquiries/[id]/select-offer/route.ts`, `src/app/api/admin/orders/route.ts`, `src/app/api/admin/orders/[id]/test-lab/route.ts`, `src/app/api/admin/orders/[id]/ship-customer/route.ts`, `src/app/api/admin/orders/[id]/invoice/route.ts`, `src/app/api/admin/suppliers/route.ts`, `src/app/api/admin/suppliers/[id]/payout/route.ts`, `src/app/api/admin/catalog/route.ts`
- Test: `tests/api/admin-ops.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireRole(["ADMIN", "OPERATOR", "TECHNICIAN"])`, `calculateCustomerPrice`, `src/lib/adapters/*`
- Produces:
  - `GET /api/admin/dashboard` (KPIs: open inquiries, active orders, lab queue, total revenue, net profit, recent notifications)
  - `GET /api/admin/inquiries` (with nested `offers` + `supplier`)
  - `POST /api/admin/inquiries/[id]/broadcast` (broadcasts to matching approved suppliers + logs SMS/WhatsApp notifications)
  - `POST /api/admin/inquiries/[id]/select-offer` `{ offerId, marginPercent }` (calculates customer price, generates `paymentToken`, sends SMS/WhatsApp quote preview)
  - `GET /api/admin/orders` (with `inquiry`, `supplier`, `testLabRecord`)
  - `POST /api/admin/orders/[id]/test-lab` `{ serialNo, hologramSealCode, physicalCheckOk, pinCheckOk, canObdCheckOk, result, notes }` — on `PASS`: generates `certificateCode`, credits supplier ledger, increments `totalDelivered`; on `FAIL`: increments `defectCount`, sets `TEST_FAILED`, does NOT credit supplier or issue certificate.
  - `POST /api/admin/orders/[id]/invoice` (issues E-Fatura/E-Arşiv)
  - `POST /api/admin/orders/[id]/ship-customer` (generates outbound standardized cargo barcode, sets `SHIPPED_TO_CUSTOMER` & 14-day return deadline)
  - `GET/POST /api/admin/suppliers` & `POST /api/admin/suppliers/[id]/payout`
  - `GET/POST /api/admin/catalog`

- [ ] **Step 1:** Implement all Admin & Test Lab routes with Zod validation and RBAC.
- [ ] **Step 2:** Write `tests/api/admin-ops.test.ts` verifying RBAC, broadcast RFQ, offer selection + margin pricing, Test Lab `PASS` vs `FAIL` behavior (including Review Focus #5), E-Invoice, and outbound shipping.
- [ ] **Step 3:** Run `npx vitest run tests/api/admin-ops.test.ts` and verify PASS.

---

### Task 6 (Wave 2 — Parallel Subagent D): Müşteri Vitrini, Hızlı Sorgu, Ödeme & Canlı Takip UI

**Files:**
- Create: `src/components/storefront/Header.tsx`, `src/components/storefront/QuickInquiryForm.tsx`, `src/components/storefront/CatalogSection.tsx`, `src/components/storefront/OrderTimeline.tsx`, `src/app/(storefront)/page.tsx`, `src/app/takip/page.tsx`, `src/app/takip/[code]/page.tsx`, `src/app/teklif/[token]/page.tsx`, `src/app/sertifika/[code]/page.tsx`

**Interfaces:**
- Consumes: Task 3 APIs (`/api/catalog`, `/api/vin/decode`, `/api/inquiries`, `/api/offers/[token]`, `/api/offers/[token]/pay`, `/api/certificates/[code]`).

- [ ] **Step 1:** Build `Header.tsx` and `QuickInquiryForm.tsx` faithfully inspired by `ui-mockup.jpg`: OtoBeyinPazari logo (`/assets/logo-main.jpg`), top quick inquiry form (Cep Telefonu + Beyin No / 17 Haneli Şase No with live VIN decode badge), "GÜVENLİ ALIŞVERİŞ — 14 Gün Koşulsuz İade & Güvence Hesabı" shield badge, orange category nav bar, and links to `/takip`, `/giris`, and `/sunum`.
- [ ] **Step 2:** Build `CatalogSection.tsx` and `src/app/(storefront)/page.tsx`: live search across OEM/HW/SW/cross-ref codes, brand/category filters, product cards with "Fiyat / Stok Sor" quick prefill, and "Katalogda Yoksa Anında Sor (15-30 dk SMS Dönüş)" fallback CTA + mobile sticky bottom action bar.
- [ ] **Step 3:** Build `/takip` and `/takip/[code]` with `OrderTimeline.tsx` rendering the 8-step order & test lab progress transparently (with zero supplier info) and link to QR Certificate when test passes.
- [ ] **Step 4:** Build `/teklif/[token]` (customer SMS quote acceptance + Escrow 3D Secure sandbox checkout + Individual/Corporate E-Invoice selector) and `/sertifika/[code]` (printable QR-coded Digital Test & Warranty Certificate + E-Fatura summary).

---

### Task 7 (Wave 2 — Parallel Subagent E): Giriş & Tedarikçi Portalı UI

**Files:**
- Create: `src/app/giris/page.tsx`, `src/components/supplier/SupplierShell.tsx`, `src/components/supplier/RfqOfferModal.tsx`, `src/app/tedarikci/layout.tsx`, `src/app/tedarikci/page.tsx`, `src/app/tedarikci/siparisler/page.tsx`, `src/app/tedarikci/cari/page.tsx`

**Interfaces:**
- Consumes: Task 3 Auth APIs (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) and Task 4 Supplier APIs (`/api/supplier/rfqs`, `/api/supplier/offers`, `/api/supplier/orders`, `/api/supplier/orders/[id]/ship`, `/api/supplier/ledger`).

- [ ] **Step 1:** Build `/giris` login page with role-aware redirect (`ADMIN`/`OPERATOR`/`TECHNICIAN` → `/admin`, `SUPPLIER` → `/tedarikci`) and quick-fill demo account buttons for rapid testing.
- [ ] **Step 2:** Build `SupplierShell.tsx` (responsive sidebar + mobile top nav, supplier rating & city badge, logout) and `/tedarikci` dashboard showing live broadcasted RFQs with 1-click "Bende Var — Fiyat Ver" modal (`RfqOfferModal.tsx`).
- [ ] **Step 3:** Build `/tedarikci/siparisler` (accepted orders, 1-click "Merkeze Kargo Kodu Üret & Sevk Et", printable OtoBeyinPazari Hub shipping label card).
- [ ] **Step 4:** Build `/tedarikci/cari` (Cari Hesap balance summary, pending vs settled hakediş ledger table, supplier quality score breakdown).

---

### Task 8 (Wave 2 — Parallel Subagent F): Admin & Test Operasyon Merkezi UI

**Files:**
- Create: `src/components/admin/AdminShell.tsx`, `src/components/admin/RfqComparePanel.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/test-lab/page.tsx`, `src/app/admin/siparisler/page.tsx`, `src/app/admin/tedarikciler/page.tsx`

**Interfaces:**
- Consumes: Task 5 Admin APIs (`/api/admin/dashboard`, `inquiries`, `orders`, `suppliers`, `catalog`).

- [ ] **Step 1:** Build `AdminShell.tsx` (dark navy `#0A2240` sidebar, KPI badges, quick links to Operasyon/RFQ, Test Laboratuvarı, Sipariş & Kargo/Fatura, Tedarikçi & Katalog, Vitrin, Sunum).
- [ ] **Step 2:** Build `/admin` with KPI strip, incoming customer inquiries list, 1-click "Tedarikçilere Toplu Mesaj (RFQ)" button, and `RfqComparePanel.tsx` (side-by-side supplier offers, live margin % slider, rounded customer price preview, 1-click "Müşteriye SMS/WhatsApp Teklif Gönder" + copyable `/teklif/[token]` link).
- [ ] **Step 3:** Build `/admin/test-lab` (orders awaiting bench test, form for Serial No, Hologram Seal Code, Physical / Pin / CAN-OBD checkboxes, PASS/FAIL submit, instant QR Certificate link on PASS).
- [ ] **Step 4:** Build `/admin/siparisler` (full order table, 1-click E-Fatura kesim + printable invoice modal, 1-click Tek Tip Kargo etiketi & çıkış) and `/admin/tedarikciler` (supplier approval, quality rating, 1-click Hakediş Ödeme + Catalog/OEM add form).

---

### Task 9 (Wave 3 — Integration & Final Verification): End-to-End Verification

**Files:**
- Verify all files across `src/`, `prisma/`, `tests/`, `public/sunum/`, `Dockerfile`, `docker-compose.yml`

- [ ] **Step 1:** Run `npx prisma db push && npx prisma db seed`.
- [ ] **Step 2:** Run full Vitest suite (`npx vitest run`) — verify all tests pass.
- [ ] **Step 3:** Run TypeScript check (`npx tsc --noEmit`) and production build (`npm run build`) — verify zero errors.
- [ ] **Step 4:** Start production server briefly and smoke-test `/api/health`, `/`, `/sunum`, `/giris`, `/takip`, `/tedarikci`, `/admin` returning expected HTTP status codes.
- [ ] **Step 5:** Final git commit summarizing the complete platform build.
