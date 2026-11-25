#!/bin/sh
set -e

echo "[OtoBeyinPazari] Veritabanı şeması senkronize ediliyor..."
ATTEMPT=0
MAX_ATTEMPTS=10
until ./node_modules/.bin/prisma db push --skip-generate; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "[OtoBeyinPazari] Veritabanı bağlantısı kurulamadı ($MAX_ATTEMPTS deneme sonrası)."
    exit 1
  fi
  echo "[OtoBeyinPazari] PostgreSQL bekleniyor... ($ATTEMPT/$MAX_ATTEMPTS)"
  sleep 3
done

echo "[OtoBeyinPazari] Temel hesaplar ve demo verileri kontrol ediliyor..."
node prisma/dist/seed.cjs

echo "[OtoBeyinPazari] 584+ gerçek OEM/ECU arşivi senkronize ediliyor..."
node prisma/dist/import-archive.cjs

echo "[OtoBeyinPazari] Next.js sunucusu başlatılıyor..."
exec node server.js
