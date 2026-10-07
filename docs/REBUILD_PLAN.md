# DodoStarter v2 — Rebuild Plan

> **Status:** plan for review. Nothing is implemented yet.
> **Date:** 2026-10-07 · **Branch:** `ccr-92c05be8-rltbln`
> **Scope:** rebuild billing on Dodo Payments (one-time **and** subscriptions), the credits system, access control (entitlements), and the Supabase schema as **rerunnable SQL files that you run yourself**, plus the security and upgrade work needed to call it production-grade.

---

## 0. Do this first: leaked secrets

The repo is **public**. Commit `395c1f9` ("one last push") added a real `.env.local`; commit `7312f9d` deleted it from the tree, but it is still in git history and in every clone/fork. It contains real values for:

`SUPABASE_SERVICE_ROLE_KEY` (full database access, bypasses RLS) · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `DODO_API_KEY` · `DODO_WEBHOOK_SECRET` · `UPSTASH_REDIS_REST_TOKEN` · `CRON_SECRET` (+ URLs)

Rotate all of them now, whether or not you approve this plan:

1. **Supabase** → Project Settings → API Keys: create a new secret key (`sb_secret_…`) and publishable key (`sb_publishable_…`), then disable the legacy JWT-based `anon`/`service_role` keys. v2 uses the new keys anyway, and the legacy keys are deprecated at the end of 2026.
2. **Dodo Payments** → Developer: delete the API key and create a new one; regenerate the webhook signing secret.
3. **Upstash**: rotate the REST token. Generate a new `CRON_SECRET`.

Rewriting git history is optional and does not help once a value has been public. Rotation is the fix.

---

## 1. Summary

v2 delivers:

- **One-time payments**: credit packs, and optionally lifetime tiers.
- **Subscriptions**: monthly and yearly plans with an optional credit allowance each period, trials, upgrades and downgrades with proration, cancel and resume, recovery from failed payments, and the Dodo customer portal.
- **A webhook pipeline** that verifies signatures, handles duplicates and out-of-order delivery, and can replay events. **Self-healing reconciliation** means a missed or late webhook never loses a purchase.
- **A credits engine** in Postgres: an append-only ledger, expiring grant buckets, atomic consume/release, and clawback on refunds and disputes.
- **Entitlements**: one function answers "what can this user do right now". It works from server code and from RLS policies.
- **Supabase SQL** as numbered, rerunnable files in `supabase/sql/` that you run in the SQL editor when you choose. Nothing is applied automatically, and I never connect to your project.
- **A current stack**: Next.js 16, React 19.3, Supabase's new API keys with `getClaims()`, and Dodo SDK v2.

Decisions I recommend. Please confirm or change them (see §13):

| # | Decision | Recommendation |
|---|---|---|
| D1 | Where credits live | Our own Postgres ledger, not Dodo's native credit entitlements |
| D2 | Subscription credits | A per-period allowance that resets each period. Each product can opt into rollover instead |
| D3 | Subscriptions per user | One active subscription. Plan changes go through Dodo's change-plan API |
| D4 | Checkout UX | Overlay checkout (the user stays on your site). Redirect is available as a config option |
| D5 | Framework | Upgrade to Next.js 16 (`proxy.ts`, Turbopack) |
| D6 | CSRF | Use Server Actions (Next's built-in Origin check) for mutations and drop the custom CSRF token system |
| D7 | Old data | Ship an optional legacy-migration SQL file. Old tables are dropped only if you run the separate drop file |

---

## 2. Audit of the current code

| Severity | Problem | Where | v2 fix |
|---|---|---|---|
| 🔴 Critical | Any logged-in user can give themselves unlimited credits. RLS allows `INSERT`/`UPDATE` on their own `credits` row, so it works from the browser console with the anon key | `credits_rls_policies.sql` | API roles get read-only access to billing and credit tables. All writes go through functions only the service role can call |
| 🔴 Critical | Checkout has no authentication and trusts `userId` from the request body, using the admin client | `app/api/dodopayments/checkout/route.ts` | A Server Action. The user comes from the session and the product comes from the DB |
| 🔴 Critical | Webhook idempotency is broken. `payload.id` doesn't exist, so each delivery gets a random UUID and retries can grant credits twice | `app/api/dodopayments/webhook/route.ts` | An inbox keyed by the `webhook-id` header, plus credit grants keyed by Dodo IDs and written in a single transaction |
| 🔴 High | Adding and deducting credits reads the balance, then writes a new one. Concurrent requests lose updates or spend the same credits twice | `lib/credits.ts`, `app/api/example-protected` | `credits_consume` locks the balance row, so the check and the deduction are atomic |
| 🔴 High | Subscriptions are never processed. `RELEVANT_EVENTS` filters out every subscription event. The handler waits for `checkout_session.*` events that don't exist. It inserts a bogus `dodo_subscriptions` row for every one-time payment, which fails the NOT NULL constraint | `webhook/route.ts` | A full event-to-handler table (§6.5) |
| 🔴 High | Users can insert their own `dodo_payments` and `dodo_subscription_changes` rows | `dodo_rls_policies.sql`, `dodo_subscription_changes.sql` | Same as the first row |
| 🟠 Medium | Open redirect: `/auth/callback?next=` is used without validation (e.g. `next=@evil.com`) | `app/auth/callback/route.ts` | Accept only same-origin relative paths |
| 🟠 Medium | The payment success page trusts URL params (`status`, `amount`, `credits`) and treats the checkout `session_id` as a payment ID | `payment-success/page.tsx` | Status comes from the DB or the Dodo API only |
| 🟠 Medium | A PostgREST filter is built by string interpolation: `.or(\`dodo_payment_id.eq.${id},…\`)` | `webhook/route.ts` | A parameterized RPC |
| 🟠 Medium | The Google OAuth rate limit uses one global key, so the whole app gets 5 Google logins per 15 minutes | `app/login/actions.ts` | Key by IP (and by email for magic links) |
| 🟠 Medium | The build ignores TypeScript and ESLint errors | `next.config.mjs` | Enforce `tsc` and lint in build/CI |
| 🟡 Low | The SQL can't be rerun (`create table`/`create policy` without guards). Running files in alphabetical order fails because `dodo_payments` references `dodo_pricing_plans` before it exists. FKs without `ON DELETE` block deleting users. `uuid_generate_v4` needs the uuid-ossp extension | `utils/supabase/migrations/*` | The conventions in §7.1 |
| 🟡 Low | Realtime credit updates never fire because `credits` isn't in the `supabase_realtime` publication | SQL | Fixed in `40_realtime.sql` |
| 🟡 Low | Dead code calls routes that don't exist (`/api/products`, `/api/customer`, `/api/checkout`). The iframe "inline checkout" doesn't work. Env names don't match (`NEXT_PUBLIC_BASE_URL` vs `NEXT_PUBLIC_APP_URL`). The webhook logs PII | `lib/dodopayments.ts`, `hooks/useBilling.ts`, `components/dodopayments/DodoCheckoutButton.tsx` | Removed or replaced |
| 🟡 Low | Docs describe a `credit_transactions` table that doesn't exist. `Footer.tsx` and `footer.tsx` both exist, which breaks on case-insensitive file systems. Some deps are pinned to `"latest"`. `.DS_Store` files are tracked. `/api/demo-tool` is unused | various | Cleanup |

---

## 3. What the current docs say (facts the design relies on)

**Dodo Payments** (SDK `dodopayments@2.54.0`, released 2026-10-06; the repo pins `^1.52.5`):

- Checkout Sessions (`POST /checkouts`) are the recommended way to sell both one-time and subscription products. A cart holds at most 20 items and can mix both kinds. A session is valid for 24 hours. The request accepts `customer: { customer_id }`, `metadata`, `return_url`, `cancel_url`, `discount_codes`, `subscription_data.trial_period_days`, `feature_flags`, `customization.theme` and `show_saved_payment_methods`. `checkoutSessions.retrieve(id)` returns `payment_id` and `payment_status`.
- After checkout, Dodo redirects to `return_url` with `payment_id`, `status` and `email` (plus `subscription_id` and `license_key` when relevant). Use these for display only; never fulfil an order from them.
- Webhooks follow the Standard Webhooks spec (`webhook-id`, `webhook-signature`, `webhook-timestamp` headers). Use `webhook-id` for idempotency. A failed delivery is retried up to 8 times over about 28 hours. The envelope is `{ business_id, type, timestamp, data }`, and **`data` is the latest state of the object at delivery time**. Events can arrive duplicated or out of order.
- There are 48 event types: `payment.{succeeded,failed,processing,cancelled}`, `refund.{succeeded,failed}`, `dispute.{opened,expired,accepted,cancelled,challenged,won,lost}`, `subscription.{active,renewed,on_hold,past_due,paused,unpaused,cancelled,failed,expired,plan_changed,updated,update_payment_method}`, `dunning.{started,recovered}`, `abandoned_checkout.{detected,recovered}`, `credit.*`, `entitlement_grant.*`, `license_key.created` and `payout.*`. There are **no** `checkout_session.*` events, though the current code waits for them.
- Subscription statuses are `pending | active | on_hold | past_due | paused | cancelled | failed | expired`. `past_due` is a grace window that ends at `past_due_ends_at`. `on_hold` means a renewal failed; updating the payment method charges what's owed and reactivates the subscription. With a trial, the first `payment.succeeded` arrives when the trial ends.
- Plan changes use `changePlan`, `previewChangePlan` and `cancelChangePlan`, with `proration_billing_mode` (`prorated_immediately | difference_immediately | full_immediately | do_not_bill`), `effective_at` (`immediately | next_billing_date`) and `on_payment_failure` (`prevent_change | apply_change`).
- Cancel at period end with `subscriptions.update(id, { cancel_at_next_billing_date: true })`. The customer portal is `customers.customerPortal.create(customer_id, { return_url })`, which returns `{ link }`. Payment-method updates use `subscriptions.updatePaymentMethod`, which returns a `payment_link`.
- All amounts are integers in minor units (cents for USD).
- The SDK accepts an `idempotencyKey` option but never sends it, because no idempotency header is configured. We de-dupe checkout creation ourselves.
- `@dodopayments/nextjs@0.3.9` lags behind the SDK:
  - Its webhook Zod schema has no `subscription.past_due`. Valid events would get a 400 and be retried until they fail.
  - Its Checkout and Customer Portal handlers take `customer_id` and the body from the client without authentication.
  - Its webhook callback doesn't expose `webhook-id`.

  So we use the SDK directly in our own handlers.
- Dodo now has native credit-based billing (`creditEntitlements` and `credit.*` events). D1 covers whether to use it.
- Dodo is the Merchant of Record: it handles tax, invoices, receipts and dunning emails. We only link to `invoice_url`.

**Supabase:**

- **From 30 Oct 2026, existing projects also stop getting default grants on new tables in `public`**, for `anon`, `authenticated` and `service_role` alike. So every SQL file includes explicit `GRANT`s.
- The legacy `anon` and `service_role` JWT keys are deprecated at the end of 2026. Use `sb_publishable_…` and `sb_secret_…`.
- Server code should authorize with `auth.getClaims()` (local JWT verification) and use `getUser()` when it needs fresh user data. Never trust `getSession()` on the server.
- In RLS policies, write `(select auth.uid())`. `SECURITY DEFINER` functions must `set search_path = ''` and have `EXECUTE` revoked from `public` and `anon`.

**Next.js 16** (16.4.0 is current): `middleware.ts` is renamed to `proxy.ts` (Node runtime). `next lint` is removed, so we use the ESLint CLI with a flat config. Turbopack is the default bundler. Node 20.9 or later is required.

---

## 4. Target architecture

```
                    ┌──────────── Next.js 16 (Vercel) ─────────────┐
 Browser ──login──▶ │ proxy.ts: refresh session (getClaims), guard  │
   │                │                                               │
   │ Server Action  │ startCheckout(productId)                      │
   ├───────────────▶│  1 auth user  2 product from DB               │──▶ Dodo API
   │  checkout URL  │  3 ensure Dodo customer  4 create session     │    POST /checkouts
   ◀────────────────│  5 record session (ref)                       │
   │                │                                               │
   │ overlay / redirect ──────────────────────────────────────────── ┼──▶ Dodo Checkout
   │                │                                               │
   │ return_url ───▶│ /billing/return?ref=… (polls status API;      │
   │                │  if the webhook is late: retrieve session/    │──▶ Dodo API (GET)
   │                │  payment and apply the same idempotent RPCs)  │
   │                │                                               │
   │                │ POST /api/webhooks/dodo ◀──────────────────────┼─── Dodo webhooks
   │                │  verify → inbox(webhook-id) → handler         │
   │                │  → (refetch subscription) → one RPC per event │
   │                │                                               │
   │                │ /api/cron/billing (CRON_SECRET): reconcile    │
   │                │  open sessions, replay failed events, upkeep  │
   │                └────────────────┬──────────────────────────────┘
   │ realtime balance                │ supabase-js (secret key, server only)
   ◀─────────────────────────────────┤ RPC → SECURITY DEFINER functions
                                     ▼
                    ┌──────────── Supabase Postgres ───────────────┐
                    │ billing_* tables · credit_* tables           │
                    │ RLS: users SELECT their own rows only        │
                    │ writes ONLY through functions (1 tx each)    │
                    │ optional pg_cron → billing_maintenance()     │
                    └──────────────────────────────────────────────┘
```

Principles:

1. Dodo is the source of truth for money and subscription state. Postgres is the source of truth for credits and access.
2. Fulfilment is driven by verified webhooks and by server-side API reads, never by the browser or redirect params.
3. Every state change is keyed on a natural ID (payment ID, subscription ID plus period, refund ID, webhook ID). Any number of retries, replays and reconciliations ends in the same result.
4. Every change that touches several rows happens in one database transaction (one RPC).

---

## 5. Billing model

### 5.1 Catalog

Dodo owns prices. The `billing_products` table owns what each product *means* in the app, with one row per Dodo product:

- `kind` is `one_time` or `subscription`. Display fields are synced from Dodo: `name`, `description`, `price_amount`, `currency`, `billing_interval` and so on.
- You edit the app fields: `tier` and `tier_rank` (e.g. free=0, pro=10, business=20), `credits_amount`, the credit expiry policy, `trial_credits`, `features[]`, `badge`, `sort_order` and `is_active`.
- `npm run billing:sync-products` pulls `products.list()` from Dodo and updates the display fields without touching the app fields. A seed SQL file has example rows with placeholder IDs.
- Checkout only accepts products that exist and are active in this table, so the client can never choose a price or a credit amount.

### 5.2 One-time purchases

- **Credit packs:** on `payment.succeeded`, grant `credits_amount × quantity` for each cart line, keyed `payment:{payment_id}:{product_id}`. By default these credits never expire; each product can set N days instead.
- **Lifetime deals:** a one-time product with `tier` set gives that tier permanently, unless the payment is refunded or lost in a dispute.

### 5.3 Subscriptions

- One live subscription per user (D3). The app blocks a second subscription checkout while one is `active`, `past_due`, `on_hold`, `paused` or `pending`, and offers "change plan" (or "resume") instead.
- The credit allowance is granted when the subscription is `active` for a new period, on `subscription.active` or `subscription.renewed`. The grant is keyed `sub:{id}:{period_start}`, so duplicate or out-of-order events can't grant twice. By default the allowance expires at the end of the period (D2); a product can roll over instead.
- **Trial** (the first period when `trial_period_days > 0`): grant `trial_credits` (default 0) instead of the full allowance. The full allowance comes with the first paid period.
- **Upgrade** (immediate, prorated): top up the current period with (new − old allowance) × the fraction of the period left, which matches `prorated_immediately` billing. Keyed `sub:{id}:{period_start}:upgrade:{product}`.
- **Downgrade:** scheduled for the next billing date. No credits are taken back.
- **Cancel:** at period end by default, and resumable until then. An immediate cancel or expiry ends access and expires the remaining subscription credits.

Access by status:

| Dodo status | Paid access | UI |
|---|---|---|
| `active` | ✅ | If `cancel_at_period_end`: "Ends on X" + Resume |
| `past_due` | ✅ until `past_due_ends_at` | Banner: update payment method |
| `on_hold` | ❌ | Banner: payment failed → update card (this reactivates) |
| `paused` | ❌ | Paused notice |
| `pending` | ❌ | "Activating…" |
| `cancelled` / `expired` / `failed` | ❌ | Resubscribe CTA |

### 5.4 Credits engine (Postgres)

- **`credit_grants`** holds buckets: `amount`, `remaining`, `expires_at` and a source (`purchase`, `subscription_period`, `trial`, `upgrade`, `bonus`, `adjustment`, `legacy_import`). `(source_type, source_id)` is unique.
- **`credit_ledger`** is append-only. It records every grant, consume, release, expiry, reversal and adjustment, with `balance_after` and which grants each change drew from.
- **`credit_balances`** has one row per user, kept in sync inside the same transactions. It is realtime-enabled for the header badge.
- **Consumption** draws from the soonest-expiring grants first, then the oldest. It is all-or-nothing and keyed per `(user, idempotency_key)`. `credits_release(key)` returns the credits if the job they paid for fails.
- **Expiry** happens lazily on every consume, plus a periodic sweep (`billing_maintenance()` via pg_cron or the cron route).
- Credits are integers (`bigint`). If you need fractions, scale them (e.g. 1 credit = 1000 units).
- *Optional:* signup bonus credits via `SIGNUP_BONUS_CREDITS`, granted once per user (keyed `bonus:signup:{user_id}`) on first login.

### 5.5 Entitlements

`billing_get_entitlements(user_id)` returns `{ tier, tier_rank, source, subscription: { status, period_end, cancel_at_period_end, … }, credits: { balance, next_expiry }, flags: { past_due, on_hold, risk } }`.

- **Server code:** `getEntitlements()` and `requireTier('pro')`, cached per request.
- **RLS on your own tables:** `private.has_tier(10)`. It is cheap, `SECURITY DEFINER`, and uses `(select auth.uid())`.
- **Client:** `get_my_entitlements()`, callable by authenticated users and limited to their own data.

### 5.6 Refunds and disputes

- **`refund.succeeded`:** record the refund and take back credits from that purchase's grant in proportion to the refund: `floor(granted × refunded / total)`, capped at what is left. The balance never goes negative; if credits were already spent, the shortfall is recorded in the ledger. A full refund also removes a lifetime tier.
- **`dispute.opened`:** record the dispute and set `risk_flag` on the customer (optionally freezing consumption).
- **`dispute.lost` / `dispute.accepted`:** treated as a full refund.
- **`dispute.won` / `dispute.cancelled`:** clear the flag.

---

## 6. Dodo Payments wiring

### 6.1 Client and env

- `lib/billing/dodo.ts` (`server-only`) creates one SDK client: `new DodoPayments({ bearerToken, environment, webhookKey, timeout: 15s, maxRetries: 2 })`.
- Env names follow the SDK defaults: `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY` and `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` or `live_mode`). `lib/env.ts` validates them with Zod at boot, so the app fails fast if config is missing or invalid.

### 6.2 Customers

`ensureDodoCustomer(user)` reads `billing_customers`. If there's no row, it calls `customers.create({ email, name, metadata: { supabase_user_id } })` and then `billing_customer_link()`. The link is unique per user, so a concurrent duplicate is harmless.

Every checkout passes `customer: { customer_id }`. Repeat purchases, saved cards and the portal then all belong to one Dodo customer.

### 6.3 Checkout (Server Action `startCheckout(productId, opts)`)

1. Get the user with `getClaims()`. Rate-limit (Upstash, optional).
2. Load the active product from the DB. For a subscription, refuse if the user already has a live one.
3. De-dupe: if the user has an `open` session for the same product that is under 30 minutes old, return its URL. This makes double clicks safe, since the SDK sends no idempotency key.
4. Call `billing_checkout_begin()` to get an internal `ref` (uuid).
5. Create the session:

   ```ts
   checkoutSessions.create({
     product_cart: [{ product_id, quantity }],
     customer: { customer_id },
     return_url: `${APP_URL}/billing/return?ref=…`,
     cancel_url: `${APP_URL}/pricing`,
     metadata: { user_id, ref, product_id, app_env },
     subscription_data: { trial_period_days }, // optional
     discount_codes,                           // optional
     feature_flags: { allow_discount_code: true },
     customization: { theme: 'system' },
     show_saved_payment_methods: true,
   })
   ```

6. Call `billing_checkout_attach(ref, session_id, checkout_url)` and return the URL.
7. The client opens the Dodo overlay (`dodopayments-checkout` v2, in test or live mode) or redirects, depending on D4.

### 6.4 Return page and reconciliation

- `/billing/return?ref=…` renders from the DB and polls `GET /api/billing/checkout/{ref}`, which only the owner can read.
- If the purchase isn't fulfilled yet, that endpoint calls `checkoutSessions.retrieve()`. If `payment_status = succeeded`, it calls `payments.retrieve()` (and `subscriptions.retrieve()`) and runs **the same idempotent RPCs as the webhook**. A late or missing webhook can't lose a purchase, and a duplicate can't grant twice.
- Cron (`/api/cron/billing`, with `Authorization: Bearer CRON_SECRET`):
  - reconciles `open` sessions older than 10 minutes,
  - replays `failed` inbox events from their stored payloads,
  - runs `billing_maintenance()`.

  Run it every 15 minutes on Vercel Pro or an external scheduler. Vercel Hobby only allows daily crons, which is still enough as a safety net.

### 6.5 Webhook endpoint: `POST /api/webhooks/dodo`

Pipeline:

1. Read the raw body and call `dodo.webhooks.unwrap(raw, { headers })`. This checks the signature and a 5-minute timestamp tolerance; a failure returns 401.
2. Call `billing_webhook_receive(webhook_id, type, timestamp, payload)`. If the event was already processed, return 200.
3. Run the handler.
4. Call `billing_webhook_finish(id, processed | ignored | failed)`.

If the handler throws, return 500 so Dodo retries. Nothing is half-applied, because each handler is one transaction. The route uses the Node runtime, caps the body at 1 MB and keeps PII out of logs.

| Event(s) | Handler |
|---|---|
| `payment.succeeded` | Upsert the payment. For one-time items, grant credits or a lifetime tier. Mark the checkout session completed. If it's a subscription payment, also re-sync that subscription |
| `payment.failed`, `payment.cancelled`, `payment.processing` | Upsert the payment. A terminal status never regresses |
| `subscription.*` (all 12) | Re-fetch with `subscriptions.retrieve(id)`, then `billing_apply_subscription(snapshot, fetched_at)`. The newer `fetched_at` wins. Grants period, trial and upgrade credits. Expires subscription credits on immediate cancel or expiry |
| `refund.succeeded` / `refund.failed` | Upsert the refund. On success, take back credits or the tier |
| `dispute.*` | Upsert the dispute. `lost`/`accepted` take back credits or the tier; `opened` sets the risk flag |
| `abandoned_checkout.*` | Mark the session abandoned (optional) |
| `dunning.*`, `credit.*`, `entitlement_grant.*`, `license_key.*`, `payout.*` | Stored and marked `ignored` |

**Ordering:** a payment's terminal status never goes back to a non-terminal one. For subscriptions, the handler always re-fetches the latest object from Dodo, then writes it under a row lock only if its `synced_at` is newer than what's stored. The newest snapshot wins even when events are delivered out of order or at the same time.

**Finding the user** (in SQL): try `metadata.user_id`, then `billing_customers.dodo_customer_id`, then `billing_checkout_sessions`. If none match (e.g. a payment created from the Dodo dashboard), the record is stored with `user_id = null` and flagged `unlinked`. Nothing is granted until you link it; `docs/BILLING.md` will include the SQL to do that.

### 6.6 Subscription management

These are Server Actions. Each one re-syncs the subscription right after its API call.

- **Manage billing:** `customers.customerPortal.create(customer_id, { return_url })`, then redirect. The customer ID comes from the DB, never from the request.
- **Cancel at period end / Resume:** `subscriptions.update(id, { cancel_at_next_billing_date: true | false })`.
- **Change plan:** `previewChangePlan` shows the prorated charge in a confirm dialog, then `changePlan`.
  - Upgrades: `effective_at: immediately`, `prorated_immediately`, `on_payment_failure: prevent_change`.
  - Downgrades: `effective_at: next_billing_date`.
  - "Cancel scheduled change" calls `cancelChangePlan`.
- **Fix payment** (`on_hold` / `past_due`): `updatePaymentMethod(id, { payment_method: { type: 'new', return_url } })`, then redirect to `payment_link`.

---

## 7. Database: rerunnable SQL

### 7.1 Conventions (every file)

- **One transaction:** each file is wrapped in `begin; … commit;`, so a failure leaves nothing half-applied.
- **Converges to the target state:** running a file brings any earlier version of this template's schema up to date.
  - Tables: `create table if not exists`, plus `alter table … add column if not exists`.
  - Constraints: `drop constraint if exists` + `add constraint` (or `DO` blocks that check `pg_constraint`).
  - `create index if not exists`.
  - `create or replace function`, with `drop function if exists` first when a signature changes.
  - `drop policy if exists` + `create policy`.
  - `create or replace trigger`.
  - Grants and revokes are idempotent by nature.
  - Publication membership is checked in a `DO` block.
  - Seeds use `insert … on conflict`.
- **No Postgres enums:** use `text` with named `CHECK` constraints, because enums can't be altered in a rerunnable way.
- **Types:** `gen_random_uuid()` (built into Postgres), `timestamptz`, and money as integer minor units.
- **Explicit grants on everything** (because of the 30 Oct 2026 Supabase change):
  - API roles get `SELECT` only where they need it.
  - **No API role has INSERT/UPDATE/DELETE on billing or credit tables.** Writes happen only inside `SECURITY DEFINER` functions, which use `set search_path = ''` and fully qualified names.
  - `EXECUTE` is revoked from `public, anon, authenticated` and granted to `service_role`, unless noted otherwise.
- **RLS** is enabled on every table in the same file that creates it. Policies use `(select auth.uid())`.
- **Deleting a user:** `ON DELETE CASCADE` for the user's credit data, `ON DELETE SET NULL` for financial records, which are kept as an anonymized audit trail.

### 7.2 Files (replacing `utils/supabase/migrations/*`)

All files live in `supabase/sql/`.

| File | Contents | Required |
|---|---|---|
| `00_foundation.sql` | `private` schema, `touch_updated_at()` trigger function, shared helpers | yes |
| `10_billing_tables.sql` | `billing_customers`, `billing_products`, `billing_checkout_sessions`, `billing_subscriptions`, `billing_payments`, `billing_refunds`, `billing_disputes`, `billing_webhook_events`, with indexes, triggers, RLS, policies and grants | yes |
| `20_credit_tables.sql` | `credit_grants`, `credit_ledger`, `credit_balances`, with RLS, policies and grants | yes |
| `30_functions.sql` | Every function in §7.4, with execute grants | yes |
| `40_realtime.sql` | Adds `credit_balances` and `billing_subscriptions` to `supabase_realtime` | recommended |
| `50_cron.sql` | Enables `pg_cron` and (re)schedules `billing_maintenance()` hourly | optional |
| `60_seed_products.sql` | Example products. Replace the placeholder IDs before running | optional |
| `90_legacy_migrate.sql` | Copies old `credits` balances into `legacy_import` grants (safe to rerun) and old payments into `billing_payments` | only if you have old data |
| `99_legacy_drop.sql` | Drops the old tables (`credits`, `dodo_*`). Destructive, so it's a separate file on purpose | optional |

Also: `supabase/sql/README.md` with the run order and verification queries, and `npm run sql:bundle`, which joins files 00–40 into one `_all.sql` you can paste in a single go.

### 7.3 Tables (abridged)

```
billing_customers         user_id PK→auth.users CASCADE · dodo_customer_id UNIQUE · email · name · risk_flag
billing_products          dodo_product_id PK · kind · name · description · price_amount · currency ·
                          billing_interval · billing_interval_count · trial_days · tier · tier_rank ·
                          credits_amount · credits_expiry('never'|'period_end'|'days') · credits_expiry_days ·
                          trial_credits · features jsonb · badge · sort_order · is_active · synced_at
billing_checkout_sessions id PK (our ref) · user_id · dodo_session_id UNIQUE · dodo_product_id · kind · quantity ·
                          status('created'|'open'|'completed'|'failed'|'expired'|'abandoned') · checkout_url ·
                          dodo_payment_id · dodo_subscription_id · expires_at
billing_subscriptions     dodo_subscription_id PK · user_id SET NULL · dodo_customer_id · dodo_product_id ·
                          quantity · status · currency · recurring_amount · tax_inclusive · interval fields ·
                          trial_period_days · current_period_start/end · cancel_at_period_end · cancelled_at ·
                          expires_at · paused_at · past_due_ends_at · scheduled_change jsonb · synced_at
billing_payments          dodo_payment_id PK · user_id SET NULL · dodo_customer_id · dodo_subscription_id ·
                          dodo_checkout_session_id · kind · status · total_amount · tax · currency ·
                          settlement_amount/currency · product_cart jsonb · discounts jsonb · card brand/last4 ·
                          invoice_id · invoice_url · error_code/message · refunded_amount · refund_status · unlinked
billing_refunds           dodo_refund_id PK · dodo_payment_id · user_id · amount · currency · status · is_partial · reason
billing_disputes          dodo_dispute_id PK · dodo_payment_id · user_id · amount · currency · stage · status
billing_webhook_events    id PK (= webhook-id) · type · event_ts · payload jsonb ·
                          status('received'|'processed'|'failed'|'ignored') · attempts · last_error · processed_at
credit_grants             id PK · user_id CASCADE · source_type · source_id · amount · remaining · expires_at ·
                          dodo_payment_id · dodo_subscription_id · UNIQUE(source_type, source_id)
credit_ledger             id bigint PK · user_id CASCADE · entry_type · amount(±) · balance_after · grant_id ·
                          allocations jsonb · idempotency_key · reason · metadata · created_at   (append-only)
credit_balances           user_id PK CASCADE · balance ≥ 0 · updated_at
```

### 7.4 Functions

| Function | Caller | Purpose |
|---|---|---|
| `billing_customer_link(user, dodo_customer_id, email, name)` | service_role | Map a user to a Dodo customer, safe under concurrency |
| `billing_product_upsert(product jsonb)` | service_role | Sync display fields from Dodo and keep the app fields |
| `billing_checkout_begin(…)` / `billing_checkout_attach(…)` | service_role | Record a session, including the 30-minute de-dupe lookup |
| `billing_webhook_receive(…)` / `billing_webhook_finish(…)` | service_role | Webhook inbox and idempotency |
| `billing_apply_payment(payment jsonb)` | service_role | Upsert a payment and fulfil one-time items |
| `billing_apply_subscription(sub jsonb, fetched_at)` | service_role | Upsert with the ordering guard and grant period credits |
| `billing_apply_refund(refund jsonb)` / `billing_apply_dispute(dispute jsonb)` | service_role | Record refunds and disputes and take back credits |
| `credits_grant` / `credits_consume` / `credits_release` / `credits_adjust` | service_role | Credit changes, each idempotent |
| `billing_maintenance()` | service_role, pg_cron | Expire grants, expire stale sessions, prune old events |
| `billing_get_entitlements(user)` | service_role | Server-side access check |
| `get_my_entitlements()` | authenticated | Same check, for `auth.uid()` only |
| `private.has_tier(min_rank)` | authenticated (in RLS) | For your own tables' policies |

### 7.5 Access matrix

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `billing_products` | SELECT active rows | SELECT active rows | SELECT |
| `billing_customers`, `billing_subscriptions`, `billing_payments`, `billing_refunds`, `billing_checkout_sessions`, `credit_*` | — | SELECT own rows | SELECT |
| `billing_disputes`, `billing_webhook_events` | — | — | SELECT |
| Any write | — | — | Only through functions |

### 7.6 Validation without touching your Supabase

I'll test the SQL by running the whole set **twice** (to prove it can be rerun) against PGlite, which is Postgres compiled to WASM and installed from npm. A small Supabase shim provides `auth.users`, `auth.uid()`, the `anon`, `authenticated` and `service_role` roles, and the `supabase_realtime` publication.

Function tests cover:

- duplicate grants,
- consuming twice with the same key,
- insufficient credits,
- the cap on refund clawback,
- subscription snapshots arriving out of order,
- RLS keeping two users' data apart.

The pg_cron file is skipped there.

---

## 8. Application changes

### 8.1 Upgrades

- **Packages:** `next` 16.4 · `react`/`react-dom` 19.3 · `dodopayments` 2.54 (drop the direct `standardwebhooks` dependency; it's used through the SDK) · `dodopayments-checkout` 2.0 · `@supabase/ssr` 0.12 · `@supabase/supabase-js` 2.117 · `zod` 4.
- **Tooling:** ESLint 9 flat config with `eslint-config-next` 16. Pin `geist` and `recharts` to real versions. Remove the unused `@mdx-js/*`. Set `engines.node >= 20.9` and add `.nvmrc`.
- **New scripts:** `typecheck`, `lint`, `test`, `test:sql`, `test:e2e`, `db:types`, `billing:sync-products`, `billing:replay-failed`, `sql:bundle`.

### 8.2 File map

**New:**

```
proxy.ts                                      session refresh + route guard (replaces middleware.ts)
lib/env.ts                                    Zod-validated env (server/public split)
lib/supabase/{server,client,admin,proxy}.ts   replaces utils/supabase/*
lib/billing/dodo.ts                           SDK singleton
lib/billing/catalog.ts                        products from DB
lib/billing/customers.ts                      ensureDodoCustomer
lib/billing/checkout.ts                       startCheckout core
lib/billing/subscriptions.ts                  cancel/resume/changePlan/preview/updatePaymentMethod/sync
lib/billing/reconcile.ts                      syncPayment / syncSubscription / reconcileSession
lib/billing/webhooks/{handler,dispatch}.ts    + handlers/{payment,subscription,refund,dispute}.ts
lib/billing/entitlements.ts                   getEntitlements / requireTier
lib/credits.ts                                consume / release / withCredits(...)
lib/http.ts                                   assertSameOrigin() for mutating route handlers
lib/logger.ts                                 structured, redacting logger
lib/safe-redirect.ts                          relative-path validator (auth callback, next=)
app/api/webhooks/dodo/route.ts
app/api/billing/checkout/[ref]/route.ts       return-page status + reconcile
app/api/cron/billing/route.ts                 + vercel.json cron
app/pricing/page.tsx                          public pricing (monthly/yearly plans + credit packs)
app/(protected)/billing/page.tsx + actions.ts plan, credits, payments, invoices, manage
app/(protected)/billing/return/page.tsx
components/billing/*                          PricingTable, CheckoutButton (overlay|redirect), PlanCard,
                                              ChangePlanDialog, CancelDialog, BillingBanner, CreditBalance,
                                              CreditHistory, PaymentHistory
hooks/use-credit-balance.ts                   realtime balance (replaces lib/credit-manager.ts)
scripts/{sync-products,replay-failed-webhooks,bundle-sql}.ts
supabase/sql/*                                §7.2
tests/{unit,sql,e2e}/*
docs/{BILLING.md,DATABASE.md,GO_LIVE.md}
```

**Changed:**

- `example-tool` and its API use `withCredits` with an `Idempotency-Key` header.
- The dashboard shows plan and credits widgets.
- The landing-page pricing section renders from the catalog.
- The header and sidebar show the realtime balance and a plan badge.
- `/auth/callback` uses the safe redirect.
- The login rate limit is keyed per IP or email.
- `proxy.ts` protects every `(protected)` route.
- `next.config.mjs` stops ignoring TS/ESLint errors, sets `poweredByHeader: false`, and adds security headers, including a CSP that allows Dodo's checkout origins for the overlay.

**Removed:**

- Routes: `app/api/dodopayments/*`, `app/api/pricing-plans`, `app/api/credits/check`, `app/api/csrf-token` (D6), `app/api/demo-tool` (unused).
- Libraries and hooks: `lib/dodopayments.ts`, `lib/pricing-plans.ts`, `lib/credit-manager.ts`, `hooks/useBilling.ts`.
- Components: `components/dodopayments/*`, `components/pricing/PricingTable.tsx`, `components/csrf-provider.tsx`, the duplicate `components/footer.tsx`.
- Utilities: `utils/csrf.ts`, `utils/supabase/*` (including `utils/supabase/migrations/*`).
- Pages: `payment-success`, and `buy-credits`, which keeps a redirect to `/pricing#credits`.
- Other: tracked `.DS_Store` files and the outdated `docs/CREDIT_*.md`.

### 8.3 UI

- **`/pricing`** (public): a Monthly/Yearly toggle for plans and a credit-packs section. The current plan is highlighted when logged in. The CTA goes to login (`next=/pricing?buy=…`) or straight to checkout.
- **`/billing`:**
  - A plan card: status badge, renewal or end date, cancel/resume, change plan with a proration preview, and "manage in portal".
  - Status banners for `past_due`, `on_hold`, a scheduled downgrade and a scheduled cancel.
  - The credit balance, credits expiring soon, and history.
  - Payment history with invoice links.
- **`/billing/return`:** processing, then success or failure, driven by server status.
- Money is formatted from minor units with `Intl.NumberFormat`, in the payment's currency.

---

## 9. Security checklist (v2)

- [ ] No billing or credit data is writable by the client (grants + RLS + function-only writes)
- [ ] Every billing action authenticates the user on the server (`getClaims()`); user IDs never come from input
- [ ] Prices, credits and products come only from the DB, validated with Zod
- [ ] Webhook: signature and timestamp tolerance, raw body, size cap, idempotent, no PII in logs
- [ ] Mutations use Server Actions (Origin check) or `assertSameOrigin()`; cookies are SameSite
- [ ] Rate limits on checkout, portal, consume and auth (per IP or user)
- [ ] Safe redirects everywhere: the `next` param is validated, and return URLs are built on the server from `NEXT_PUBLIC_APP_URL`
- [ ] Secrets: the new Supabase keys; the secret key is used only in `lib/supabase/admin.ts` (`server-only`)
- [ ] Security headers and a CSP that allows Dodo checkout; `poweredByHeader: false`
- [ ] Test and live are separated by env. Separate Supabase projects for test and live are recommended

---

## 10. Testing and verification

- **Unit (Vitest):**
  - webhook dispatch with fixtures for every handled event, signed with a test secret via `standardwebhooks`;
  - a bad signature returns 401, and a duplicate delivery does nothing;
  - checkout validation, entitlement resolution, and the safe redirect.
- **SQL (Vitest + PGlite):** see §7.6.
- **E2E (Playwright, using the Chromium available in this environment):** login → pricing → checkout (overlay mocked) → simulated signed webhook → credits and subscription visible; then consume credits in the example tool.
- **Static checks:** `tsc --noEmit`, ESLint and `next build` must pass.
- **What I can't do from this environment:**
  - make real Dodo test-mode payments;
  - read `docs.dodopayments.com` and `supabase.com`, which the network policy blocks.

  You'll run the go-live checklist with test cards `4242 4242 4242 4242` (success) and `4000 0000 0000 0002` (decline), using a future expiry (e.g. 06/32) and CVV 123.

---

## 11. Implementation phases (after approval)

| Phase | Work | Done when |
|---|---|---|
| 1 Foundation | Dependency upgrades, Next 16 `proxy.ts`, env validation, new Supabase clients and keys, ESLint flat config, build stops ignoring errors, safe redirect, rate-limit fixes | `typecheck`, `lint` and `build` pass |
| 2 Database | All SQL files and their README, PGlite tests, a hand-written `types/database.ts` (plus a `db:types` script to regenerate it from your project) | The SQL suite passes, including the double run |
| 3 Dodo core | SDK client, customers, catalog sync, checkout action, return page with status/reconcile API, webhook route and handlers, cron route | Unit tests pass; simulated webhooks fulfil orders correctly |
| 4 Subscriptions | Portal, cancel/resume, change plan with preview, cancel scheduled change, update payment method, banners | E2E flows pass |
| 5 Credits | `withCredits`, example tool rewrite, realtime balance hook, history UI | Double-spend and idempotency tests pass |
| 6 UI | `/pricing`, `/billing`, landing pricing from the catalog, dashboard widgets, nav, redirects from old routes | E2E passes |
| 7 Docs & cleanup | README rewrite, `BILLING`/`DATABASE`/`GO_LIVE` docs, delete legacy code | Final review |

Each phase is its own commit on `ccr-92c05be8-rltbln`, pushed after its checks pass.

---

## 12. Manual steps for you (these also go into `docs/GO_LIVE.md`)

1. Rotate the leaked secrets (§0).
2. **Dodo (test mode first):**
   - Create products: for example, credit packs (one-time) and Pro Monthly / Pro Yearly (subscriptions, optionally with a trial).
   - Create an API key and put it in `DODO_PAYMENTS_API_KEY`.
   - Add a webhook endpoint `https://<your-app>/api/webhooks/dodo` (the URL changes from today's `/api/dodopayments/webhook`; for local dev use a tunnel such as ngrok or cloudflared). Put its signing secret in `DODO_PAYMENTS_WEBHOOK_KEY`.
   - Set the customer-portal return URL and your branding.
3. **Supabase:**
   - Run `supabase/sql/00` through `40` in the SQL editor. Then run 50 and 60 if you want them, and 90/99 only if you're migrating old data.
   - Auth → URL Configuration: set the site URL and add the `/auth/callback` redirect.
   - Create the publishable and secret keys.
4. Fill in the app fields of `billing_products` (credits, tier, features). Either run `npm run billing:sync-products` and then use the table editor, or edit `60_seed_products.sql`.
5. **Vercel:** set the env vars and enable cron. For production, use live-mode keys, live products and, ideally, a separate Supabase project.

---

## 13. Open questions (the answers change the build)

1. **D1:** Is it OK to keep credits in our Postgres ledger rather than Dodo's native credit entitlements? With native credits, every use needs a Dodo API call, it's harder to make a deduction atomic with your app's own writes, and you're more tied to Dodo. Our ledger is instant and transactional.
2. **D2:** Should subscription credits reset each period (the default), or roll over?
3. Do you want lifetime (one-time) tiers, or only credit packs for one-time purchases?
4. Should trials come with credits? If so, how many?
5. Is there real data in the old tables (`credits`, `dodo_payments`, …) that must be migrated?
6. **D5:** Is it OK to upgrade to Next.js 16 now? The alternative is to stay on 15.5 and upgrade later.
7. Should anything else be dropped or kept? For example the placeholder `reports` page and the dashboard demo charts. The SEO setup stays as is.

---

## 14. Sources

- **npm packages** (the SDK type definitions are the primary source for the API contracts):
  - `dodopayments@2.54.0`: checkout sessions, payments, subscriptions, refunds, disputes, webhooks, credit entitlements
  - `@dodopayments/nextjs@0.3.9`
  - `@dodopayments/core@0.3.15`
  - `dodopayments-checkout@2.0.0`
- **Dodo docs:**
  - [Checkout sessions](https://docs.dodopayments.com/developer-resources/checkout-session)
  - [Webhooks](https://docs.dodopayments.com/developer-resources/webhooks)
  - [Subscription webhooks](https://docs.dodopayments.com/developer-resources/webhooks/intents/subscription)
  - [Subscription integration guide](https://docs.dodopayments.com/developer-resources/subscription-integration-guide)
  - [Upgrades and downgrades](https://docs.dodopayments.com/developer-resources/subscription-upgrade-downgrade)
  - [Customer portal](https://docs.dodopayments.com/features/customer-portal)
  - [Next.js adaptor](https://docs.dodopayments.com/developer-resources/nextjs-adaptor)
  - [Testing / test cards](https://docs.dodopayments.com/miscellaneous/testing-process)
  - [Supabase example](https://docs.dodopayments.com/developer-resources/webhooks/examples/supabase-example)
- **Supabase:**
  - [Tables not exposed to the Data API automatically (30 Oct 2026)](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
  - [Migrating to the new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)
  - [RLS performance and best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
  - [Creating an SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
  - [pg_cron](https://supabase.com/docs/guides/database/extensions/pgcron)
- **Next.js 16:**
  - [Upgrade notes (proxy.ts, breaking changes)](https://www.wisp.blog/blog/nextjs-16-1-upgrade-guide)
  - [`next lint` removal](https://dev.to/mahdi_benrhouma_fe1c6005/nextjs-16-removed-next-lint-eslint-9-migration-390n)

> `docs.dodopayments.com` and `supabase.com` are blocked by this environment's network policy. The Dodo facts above come from the SDK's own type definitions, plus doc excerpts found through web search.
