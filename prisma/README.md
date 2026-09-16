# AVELIA database

The schema targets PostgreSQL through Prisma ORM and is ready for Supabase and
Vercel.

## First setup

1. Create `.env.local` from `.env.example`.
2. Set `DATABASE_URL` to the Supabase transaction-pooler URL used by Vercel.
3. Set `DIRECT_URL` to the direct or session-pooler URL used by Prisma CLI.
4. Install dependencies with `pnpm install` (this also generates Prisma Client).
5. Apply the committed migration with `pnpm db:deploy`.
6. Insert or update the three categories and 28 products with
   `pnpm db:seed`.

The seed is repeatable: it uses upserts and does not delete orders, users, or
payments. If `DATABASE_URL` is absent, storefront reads intentionally fall back
to the checked-in product catalog. The cart also uses a validated cookie-backed
preview locally, so UI work remains available before Supabase is connected.
Creating a real order always requires PostgreSQL and never falls back to browser
prices or totals.

Checkout reserves stock in the same serializable transaction that creates the
user, order, immutable line-item prices, and pending payment. Configure
`INVENTORY_CRON_SECRET` and schedule
`GET /api/internal/orders/release-expired` with a matching bearer token after
deployment so expired reservations are released. Application requests never
run schema migrations implicitly.

The same protected cleanup request removes expired API rate-limit windows. In
production, rate-limit counters are stored in PostgreSQL so limits remain
consistent across Vercel instances; local development falls back to an
in-memory counter when no database is configured.

For schema changes during development, create a new migration with
`pnpm db:migrate -- --name <migration-name>`. Never edit an already-applied
migration.
