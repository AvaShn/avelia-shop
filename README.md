# AVELIA

AVELIA is a mobile-first Persian RTL beauty ecommerce experience for makeup,
skincare, and fragrance, built with Next.js 15.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill only the values needed for the phase being developed.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e` after installing Playwright Chromium

## Delivery status

Phase 1 establishes the application foundation. Phase 2 adds AVELIA's design
system and shared UI primitives. Phase 3 delivers the complete premium beauty
homepage. Phase 4 adds a typed 28-item cosmetics catalog (including the 19
provided product assets), search, category and discount filters, sorting,
discount pricing, product galleries, detailed product pages, related products,
metadata, structured data, and a sitemap. Prisma persistence begins in Phase 5.
