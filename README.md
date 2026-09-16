# AVELIA

AVELIA is a mobile-first Persian RTL beauty ecommerce experience for makeup,
skincare, and fragrance, built with Next.js 15.

## Local development

1. Copy `.env.example` to `.env.local`.
2. For database-backed products, set the Supabase `DATABASE_URL` and
   `DIRECT_URL` values described in `prisma/README.md`.
3. Install dependencies with `pnpm install`.
4. Run `pnpm db:deploy` and `pnpm db:seed` after connecting Supabase.
5. Start the development server with `pnpm dev`.

## Quality checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` after `pnpm build` and installing Playwright Chromium

## Delivery status

Phase 1 establishes the application foundation. Phase 2 adds AVELIA's design
system and shared UI primitives. Phase 3 delivers the complete premium beauty
homepage. Phase 4 adds a typed 28-item cosmetics catalog (including the 19
provided product assets), search, category and discount filters, sorting,
discount pricing, product galleries, detailed product pages, related products,
metadata, structured data, and a sitemap. Phase 5 adds the PostgreSQL schema,
Prisma client and versioned migrations, repeatable catalog seed,
database-backed storefront repositories, and typed product APIs. Phase 6 adds
persistent anonymous carts, responsive cart and checkout pages, server-side
price and stock verification, transactional order creation, idempotency,
inventory reservations, public order tracking, and the Telegram continuation
link. Phase 7 completes the typed API layer: cursor-based product APIs, exact
cart and order contracts, expiring Telegram handoff and verified webhook,
private receipt storage, authenticated admin order review, shared response
envelopes, request-size limits, CSRF checks, and database-backed rate limiting.

API setup and contracts are documented in [`docs/API.md`](docs/API.md).
