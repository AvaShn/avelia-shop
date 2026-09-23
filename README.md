# AVELIA

AVELIA is a mobile-first Persian RTL beauty ecommerce application built with
Next.js 15, Prisma ORM, and PostgreSQL.

## Local architecture

```text
Browser → Next.js localhost → Prisma ORM → PostgreSQL Docker container
```

The local database runs as the `avelia-postgres` container and persists its
data in the named `avelia_postgres_data` Docker volume.

## Prerequisites

- Node.js 20.19 or newer
- pnpm 11
- Docker Desktop with Docker Compose

## First-time local setup

The repository includes local `.env` and `.env.local` files. If they are
missing after a fresh clone, copy `.env.example` to both filenames and replace
the example password consistently in `POSTGRES_PASSWORD` and `DATABASE_URL`:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.local
```

Install dependencies and generate Prisma Client:

```bash
pnpm install
pnpm prisma generate
```

Start PostgreSQL and wait until its health status is `healthy`:

```bash
docker compose up -d
docker compose ps
docker ps
```

Apply the committed migrations and seed the catalog:

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm db:verify
```

The seed is repeatable. It upserts categories and products by unique slug, so
running it more than once updates the catalog without creating duplicates.
The verification command checks the six required core tables and reports the
seeded category and product counts through Prisma Client.

Start the application:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). With `DATABASE_URL`
configured, product pages and `/api/products` read through the repository and
Prisma layers from PostgreSQL.

## Everyday database commands

Start the database:

```bash
docker compose up -d
```

Stop the container while keeping local data:

```bash
docker compose down
```

Apply existing migrations:

```bash
pnpm prisma migrate deploy
```

Create and apply a migration while developing a schema change:

```bash
pnpm prisma migrate dev --name describe_your_change
```

Seed or refresh the catalog:

```bash
pnpm prisma db seed
```

Open Prisma Studio:

```bash
pnpm prisma studio
```

Prisma Studio opens at `http://localhost:5555` by default. Select `Product` to
view, add, edit, or delete local products. Use an existing `Category` relation,
store prices as whole rials in `priceRial`, keep stock non-negative, and provide
at least one image path in the `images` text array. The exact field types and
safe entry values are documented in
[`docs/PRODUCT_DATA_ENTRY.md`](docs/PRODUCT_DATA_ENTRY.md).

To remove the database and all local records as well as the container, use
`docker compose down --volumes`. This is destructive and is not part of the
normal stop flow.

## Quality checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` after `pnpm build` and installing Playwright Chromium

## Project status

The application includes the premium Persian storefront, catalog and product
pages, discounts, customer registration and revocable login sessions,
persistent cart and address-aware checkout, transactional orders with delivery
snapshots, inventory reservations, Telegram receipt workflow, customer order
history, public order tracking, and protected admin review APIs. API setup and contracts are documented in
[`docs/API.md`](docs/API.md), and database details are documented in
[`prisma/README.md`](prisma/README.md).

Local polling and production webhook setup for the payment bot are documented
in [`docs/TELEGRAM_SETUP.md`](docs/TELEGRAM_SETUP.md).
