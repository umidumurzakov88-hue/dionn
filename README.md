# Dionn — Art of Furniture

Online furniture store: storefront in **Russian (default), Uzbek and English**, light/dark theme, UZS/USD prices,
admin panel with revenue analytics, Supabase backend and a Telegram bot for order notifications.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Telegram Bot API

---

## 1. First-time setup

1. **Database** — open Supabase → *SQL Editor* → *New query*, paste the whole of `supabase/schema.sql`, press **Run**.
   (Safe to run again after updates.)
2. **Demo content** (optional) — `node --env-file=.env.local scripts/seed.mjs`
   Wipe and re-seed: `node --env-file=.env.local scripts/seed.mjs --reset`
3. **Auth URLs** — Supabase → *Authentication → URL Configuration*:
   - Site URL: `http://localhost:3000` (later your domain, e.g. `https://dionn.uz`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://dionn.uz/auth/callback`
4. **Google login** — Supabase → *Authentication → Providers → Google* (Client ID / Secret from Google Cloud Console).
5. Install & run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000 → redirects to `/ru`.

### Admin access
Sign in with **umidumurzakov88@gmail.com** — this e-mail becomes *admin* automatically (table `admin_emails`).
Admin panel: **/admin**. Other staff: Admin → Клиенты → open a user → change role to *Менеджер* or *Администратор*.

## 2. Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-only: creates orders, Telegram webhook, seed |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (`https://dionn.uz` in production) |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat(s) that receive new orders (comma-separated) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string; Telegram sends it back to prove requests are genuine |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | `Dionn_furniture_bot` — used for "Enable notifications" links |
| `CLICK_*`, `PAYME_*`, `UZUM_*` | Online payments (to do — methods appear at checkout once set) |

## 3. Telegram bot

- **New orders, quick orders, callback requests** → message to `TELEGRAM_ADMIN_CHAT_ID`.
  The admin must have pressed **/start** in @Dionn_furniture_bot once. To use a group instead: add the bot to the
  group and put the group ID (negative number) into `TELEGRAM_ADMIN_CHAT_ID`.
- **Customer status updates** — after checkout the customer taps *"Подключить уведомления"* → opens the bot with a
  one-time token → every status change in the admin panel is sent to them in their language.
  This needs the webhook: after deploying to a public **https** domain, go to *Admin → Настройки → Подключить webhook*.

### Telegram login
*«Войти через Telegram»* → one-time link opens @Dionn_furniture_bot → user presses **Start** → bot sends a 6-digit code →
user enters it on the site → signed in (account created on first login, name taken from Telegram, chat linked for order notifications).
Code valid 10 min, 5 attempts, one code per minute. Table: `tg_logins` (`supabase/telegram-login.sql`).
On localhost the site pulls bot updates itself while the login page waits; on the live site the webhook is used
(Admin → Настройки → «Подключить webhook» after setting `NEXT_PUBLIC_SITE_URL=https://…`).

## 4. Deploy (Vercel)

1. Push the project to GitHub, import it in Vercel.
2. Add all variables from `.env.local` in *Project → Settings → Environment Variables*;
   set `NEXT_PUBLIC_SITE_URL=https://your-domain`.
3. Connect the domain, then *Admin → Настройки → Подключить webhook*.
4. Add the domain to Supabase Auth URL configuration (step 1.3).

## 5. Project map

```
src/app/[locale]/        storefront (ru | uz | en): home, catalog, product, cart, checkout, order, account, …
src/app/admin/           admin panel (dashboard, orders, customers, products, categories, banners, promo, reviews, settings)
src/app/admin/actions.ts all admin mutations (server actions, RLS-checked)
src/app/api/             orders (server-side price calculation), promo, callback, products, telegram/webhook
src/i18n/                translations ru.ts / uz.ts / en.ts
src/lib/                 supabase clients, data access, telegram, payments, formatting
src/proxy.ts             locale routing + session refresh + /admin guard (Next 16 "proxy" = old middleware)
supabase/schema.sql      tables, RLS policies, storage bucket, analytics functions
scripts/seed.mjs         demo catalog
```

Prices are stored in **UZS**; the USD view is converted with the rate from *Admin → Настройки*.
Order totals are always recalculated on the server — the browser's prices are never trusted.

## 6. Not done yet

- **Click / Payme / Uzum** — redirect URLs are prepared in `src/lib/payments.ts`; the providers' confirmation
  callbacks (`/api/payments/*`) must be built with the merchant credentials before enabling.
- Demo photos in `public/demo` are from Unsplash — replace them with your own products in the admin panel.
