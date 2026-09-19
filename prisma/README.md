# AVELIA local database

The Prisma schema targets PostgreSQL 16. The connection string is read only
from `DATABASE_URL`; credentials are not embedded in application or Prisma
code.

## Initialize the local database

1. Start PostgreSQL with `docker compose up -d`.
2. Confirm the `avelia-postgres` service is healthy with `docker compose ps`.
3. Generate the client with `pnpm prisma generate`.
4. Apply the committed migrations with `pnpm prisma migrate deploy`.
5. Seed categories and products with `pnpm prisma db seed`.
6. Verify the required tables and catalog counts with `pnpm db:verify`.

The seed uses `upsert` with the unique category and product slugs. It can be
run repeatedly and does not delete or duplicate existing users, orders,
payments, categories, or products.

## Schema development

After changing `prisma/schema.prisma`, create a new versioned migration:

```bash
pnpm prisma migrate dev --name describe_your_change
```

Never edit a migration that has already been applied. Production-style
application requests never execute migrations implicitly.

## Inspect and edit data

Run `pnpm prisma studio` and open `http://localhost:5555`. Prisma Studio can
manage `Category` and `Product` records as well as inspect carts, orders, and
payments.

The storefront uses PostgreSQL whenever `DATABASE_URL` is configured. The
checked-in catalog remains only as a no-database UI fallback; it is not used
when the Docker connection is available. Checkout and order creation always
require PostgreSQL.
