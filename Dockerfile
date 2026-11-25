# Multi-stage Next.js 15 standalone build for Coolify (Auto DB push + Seed + 584+ OEM Archive)
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build
RUN mkdir -p prisma/dist \
  && npx esbuild prisma/seed.ts --bundle --platform=node --external:@prisma/client --outfile=prisma/dist/seed.cjs \
  && npx esbuild prisma/import-archive.ts --bundle --platform=node --external:@prisma/client --outfile=prisma/dist/import-archive.cjs

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOME=/tmp

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Isolated Prisma CLI with all transitive dependencies (effect, @prisma/config, engines, wasm)
RUN mkdir -p /app/prisma-cli \
  && npm install --prefix /app/prisma-cli --no-audit --no-fund prisma@6

# Runtime Prisma Client, schema, JSON OEM archive & pre-bundled seed scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
