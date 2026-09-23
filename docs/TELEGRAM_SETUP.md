# Telegram payment setup

AVELIA supports two mutually exclusive Telegram update modes:

- Local development: Bot API long polling forwards updates to the local
  Next.js webhook route.
- Production/Vercel: Telegram sends updates directly to the public HTTPS
  webhook.

Telegram does not allow `getUpdates` while a webhook is active. The local poll
command removes an existing webhook without dropping pending updates. Setting
the production webhook disables polling automatically.

## Secrets

Never place real values in `.env.example`. Put these values in `.env.local`:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_ADMIN_ID=
TELEGRAM_WEBHOOK_SECRET=
PAYMENT_SESSION_SECRET=
PAYMENT_CARD_NUMBER=
PAYMENT_CARD_HOLDER=
```

`TELEGRAM_BOT_USERNAME` is the username without `@`. Both secrets must be long,
random, URL-safe values. `TELEGRAM_ADMIN_ID` is the numeric private chat ID that
receives receipt notifications. The admin must start the bot at least once so
Telegram allows the bot to send that chat messages.

If you do not know the numeric admin ID, run local polling, open the bot, and
send `/id`. Copy the number returned by the bot into `TELEGRAM_ADMIN_ID`, then
restart both Next.js and polling.

Local receipt images are stored privately under `.local-data/payment-receipts`
and are ignored by Git. Production requires the private Supabase Storage
variables because Vercel's filesystem is ephemeral.

## Local run

Terminal 1:

```bash
docker compose up -d
npm run db:deploy
npm run dev:telegram
```

`dev:telegram` starts both Next.js and Telegram polling with the enabled Windows
system proxy. Keep that terminal open. It intentionally claims the port from
`NEXT_PUBLIC_APP_URL` (port 3000 by default) instead of silently moving to a
different port.

The following commands are diagnostics and one-time bot configuration; they do
not need to stay open alongside `dev:telegram`:

```bash
npm run telegram:check
npm run telegram:configure
```

Then add a product to the cart, create an order, select **Continue securely in
Telegram**, press Telegram's Start button, and send a clear JPEG, PNG, or WebP
receipt smaller than 8 MB.

The order should move from `PENDING_PAYMENT`/`PENDING` to
`WAITING_REVIEW`/`UNDER_REVIEW`. The local receipt can be viewed through the
authenticated admin receipt API or the `/admin` dashboard after admin
authentication is configured.

To enable the local admin dashboard, create a password hash:

```bash
npm run admin:hash-password -- "your-long-admin-password"
```

Then place the generated hash and these values in `.env.local` and restart
Next.js:

```dotenv
AUTH_SECRET=a-random-secret-with-at-least-32-characters
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD_HASH=the-generated-hash
```

Open `/admin` to review the private receipt and approve or reject the payment.
The bot notifies the customer after that decision.

`dev:telegram` and the Telegram scripts automatically use the enabled Windows
system proxy (for example v2rayN). `npm run telegram:poll` remains available for
manual diagnostics, but do not run it at the same time as `dev:telegram`.
Regular `npm run dev` remains available for storefront-only work when Telegram
does not need to receive or download files.

## Vercel webhook

Set the same Telegram, payment, database, private receipt storage, and admin
environment variables in Vercel. After deployment run once from a trusted local
terminal:

```bash
npm run telegram:webhook:set -- https://your-project.vercel.app
npm run telegram:webhook:status
```

To return the bot to local polling mode:

```bash
npm run telegram:webhook:delete
```
