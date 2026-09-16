# AVELIA API

All JSON routes return one envelope:

```json
{
  "data": {},
  "error": null,
  "meta": { "requestId": "..." }
}
```

Failures set `data` to `null`, return a typed error with a Persian recovery
message, and retain `meta.requestId` for server-side diagnostics. Prisma models
are never serialized directly.

## Public routes

- `GET /api/products`: `cursor`, `limit`, `q`, `category`, `sort`, `discount`,
  `featured`, and `availability=all|in-stock|out-of-stock`.
- `GET /api/products/[slug]`: explicit product DTO plus related products.
- `GET /api/cart`: read or initialize the anonymous cart.
- `POST /api/cart`: add `{ productId, quantity }`.
- `PATCH /api/cart/[productId]`: set `{ quantity }`.
- `DELETE /api/cart/[productId]`: remove one product.
- `POST /api/orders`: create an order from server-repriced cart contents. A
  valid `Idempotency-Key` header is required.
- `GET /api/orders/[token]`: customer-safe order status with no internal IDs or
  customer details.
- `POST /api/telegram/session`: create an expiring handoff from
  `{ orderToken }`.
- `POST /api/telegram/webhook`: Telegram update receiver protected by
  `X-Telegram-Bot-Api-Secret-Token`.

## Admin routes

- `POST /api/admin/session`: creates an eight-hour `HttpOnly`, `SameSite=Strict`
  admin session.
- `DELETE /api/admin/session`: clears the session.
- `GET /api/admin/orders`: filter by `status`, `paymentStatus`, or `q`, with
  cursor pagination.
- `GET /api/admin/orders/[token]`: customer, line item, review, and receipt
  metadata.
- `GET /api/admin/orders/[token]/receipt`: authenticated private image proxy;
  no storage URL or object key is exposed.
- `POST /api/admin/orders/[token]/payment`: `{ action: "APPROVE" | "REJECT",
note? }` using the defined state transitions.

Generate the password hash before deployment:

```powershell
pnpm admin:hash-password -- "a-long-unique-password"
```

Place the result in `ADMIN_PASSWORD_HASH`, set the matching `ADMIN_EMAIL`, and
use a random `AUTH_SECRET` of at least 32 characters.

## Telegram and receipt storage

Set the Telegram bot token, username, admin chat ID, webhook secret, payment
session secret, card details, and private Supabase Storage values from
`.env.example`. The receipt bucket must remain private. Telegram photos are
size- and content-type-validated, copied to a private object key, and served to
admins only through the authenticated proxy.

Configure Telegram's webhook URL as
`https://<domain>/api/telegram/webhook` and use the exact
`TELEGRAM_WEBHOOK_SECRET` as Telegram's webhook secret token.

## Operational rules

- Browser mutations reject cross-site requests.
- JSON request bodies have explicit byte limits.
- Sensitive routes are rate-limited; production counters use PostgreSQL.
- Receipt webhook updates and checkout requests are idempotent.
- Diagnostic details stay in server logs and are correlated by `requestId`.
- Database migrations are applied only through `pnpm db:deploy`.
