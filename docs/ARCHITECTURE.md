# Architecture

Phase 2 state. Updated at the end of each phase.

## Shape

```
Browser ── Next.js on Vercel ── Supabase (Postgres + Auth + Storage)
             │
             ├─ public pages: cached, read with the publishable key (anonymous role)
             └─ /admin: per-request, runs as the signed-in user; RLS decides everything
```

There is no privileged server key in the app. A bug in the Next.js code cannot write data the signed-in user is not allowed to write, because Postgres enforces it.

## Folders

| Path | Holds |
|---|---|
| `src/app/(id)`, `src/app/en` | Generated route files, one per page per language. Each binds a view to a fixed locale. Do not edit by hand |
| `src/views` | The real public pages (home, harga-emas, katalog, produk, kalkulator, artikel, …) and the reservation Server Action. They take the language as a prop |
| `src/app/admin` | `login`, `(panel)/{harga,rumus,produk,leads,artikel,toko}` |
| `src/app/dev/break-ui` | Dev-only stress page, 404 in production |
| `src/components` | `layout`, `price`, `catalog`, `product`, `seo`, `ui` |
| `src/lib/catalog.ts` | Pure catalogue logic: estimates, URL filters, sorting, paging |
| `src/lib/seo.ts` | JSON-LD builders, indexing switch, opening-hours parsing |
| `src/lib/analytics.ts`, `src/lib/tryon` | Event wrapper (no provider chosen yet); try-on adapter with a stub |
| `scripts` | `seed-demo.mjs`, `seed-articles.mjs`, `make-demo-model.mjs`, `break-ui-check.mjs` |
| `src/proxy.ts` | Next 16 "proxy" (formerly middleware): refreshes the session, redirects `/admin/*` without a session |
| `src/lib/pricing` | The only place prices are computed: estimate, 24K reference and per-gram derivation, buyback, settings |
| `src/data` | The concept collection and the manifest of its generated photos |
| `src/lib/data` | Cached public reads, each tagged for on-demand revalidation (`public.ts`, and `content.ts` for price history and articles) |
| `src/lib/warm.ts` | Background refresh of product pages after an admin change |
| `src/lib/auth` | `requireAdmin()` — the data-access-layer guard |
| `src/lib/supabase` | `public` (anonymous, cookie-less), `server` (session), generated types |
| `src/i18n` | Typed dictionaries. `id.ts` is the source; add `en.ts` in Phase 2 |
| `src/config/owner.ts` | `TODO_OWNER` marker and `ownerValue()` |
| `supabase/migrations` | Schema, RLS, triggers, reference rows |
| `supabase/seed` | Demo data, clearly labelled |
| `tests` | `unit`, `rls` (incl. `role-matrix.sql`), `e2e` |

## Price formula

One number drives everything: the **24K reference price per gram**.

```
reference          = benchmark × (1 + manual adjustment %)                 rounded to the per-gram step
price per gram (K) = reference × purity(K)                                 rounded to the per-gram step
gold value         = net gold weight × price per gram (K)
estimated price    = gold value + workmanship + stones/material + markup + tax     then rounded
buyback per gram   = price per gram (K) × buyback % (per karat, else the default)
buyback estimate   = net gold weight × buyback per gram − deduction        rounded DOWN, never below 0
```

- Markup is a percentage of gold value + workmanship + material; tax is a percentage of that plus the markup. Each part is counted once.
- Workmanship per product: `per_gram`, `fixed` or `percent` of the gold value. Markup per product, or the site default when the product has none.
- A product with `manual_price_idr` shows that price as is and is never recalculated.
- Final rounding is a site setting (default: **up** to the nearest Rp 1.000). Integer arithmetic throughout (milligrams, whole Rupiah, BigInt intermediates).
- Code: `src/lib/pricing/calculate.ts` (estimate), `reference.ts` (reference, per-gram derivation, buyback), `settings.ts` (the tunable settings and their defaults). `src/lib/catalog.ts` applies them to products. The catalogue, product page, home page and calculator all call the same functions.

**Where the numbers live.** The reference is the `gold_prices` row of the inactive karat `REF`, so its history, timestamp and "who changed it" come from the existing price triggers. Purity is `karats.purity_percent`. Everything else (benchmark, adjustment, source and its URL, retrieval time, "simulated" flag, default markup, tax, buyback rule, per-gram step) is JSON in `site_settings.pricing`; when that is empty the defaults in `settings.ts` apply.

**Saving** (`/admin/rumus`, owner only) recalculates every active karat's `gold_prices` row from the reference and asks for confirmation first. Prices of products are not stored, so they follow by themselves. The older per-karat screen (`/admin/harga`) still works for a one-off correction, but the next save of the formula replaces it.

**The reference is not a live feed.** The default benchmark is PT Antam's published buyback price for 1 g on 16 Nov 2026 (Rp 2.298.000), chosen as a stand-in for the raw metal value because it leaves out the minting premium and retail spread in Antam's selling price for a small bar (Rp 2.522.000 that day). It is flagged "simulated" and the site labels every figure accordingly until the owner enters the shop's own reference.

## Concept collection

While `site_settings.demo_mode` is on, the catalogue is led by twelve fictional designs from `src/data/concept-products.ts`. They are mapped onto the same `Product` type as database rows, priced by the same formula, badged "Konsep", carry the notice "DESAIN KONSEP — HARGA ILUSTRASI — BUKAN STOK TOKO" (English pages: "DESIGN CONCEPT — ILLUSTRATIVE PRICE — NOT ACTUAL STORE INVENTORY"), cannot be reserved, are kept out of the sitemap and get no Product structured data. The older placeholder rows flagged `is_demo` stay reachable by URL (they are the test fixtures) but are not listed beside them. Turn demo mode off and only database products remain.

Photos for the concept collection are generated outside the app: originals go in `assets/generated/`, `node scripts/process-concept-images.mjs` writes WebP files to `public/images/` and records them in `src/data/concept-images.json`. A product without a photo shows a line drawing and "Foto studio sedang disiapkan". `--check` lists what is missing, `--prompts` prints the brief for each image.

## Data model

`stores`, `site_settings` (single row), `karats`, `gold_prices` (current), `gold_price_history`, `categories`, `products`, `product_images`, `leads`, `articles`, `testimonials`, `audit_log`, `admin_users`. Storage buckets: `product-images`, `product-models`.

Notable rules:

- `gold_prices` has a trigger that stamps `updated_at`/`updated_by` from the session (a client cannot spoof them) and appends to `gold_price_history` and `audit_log` on every real change. History and audit cannot be written any other way.
- `admin_users` is the email allowlist. A trigger on `auth.users` links a row to its auth user once that email is confirmed, and unlinks it if the email changes. RLS checks the linked `user_id`, never a claim the client controls.
- `products.status`: `draft` is admin-only; `published`, `sold`, `out_of_stock` are public (sold items stay visible, marked).
- Money `bigint` Rupiah; weight `numeric(8,3)`; timestamps `timestamptz` (UTC), displayed in `site_settings.timezone`.
- Migration `20261116000100` adds `site_settings.pricing` and the product detail columns (`sku`, `name_en`, `description_en`, `gross_weight_g`, `gemstone_details(_en)`, `material_cost_idr`, `markup_percent`, `manual_price_idr`, `specs`). Applied to the development project on 16 Nov 2026. The app reads these columns when present and defaults when not, so the same code also runs against a database that does not have them yet (there the formula screen stores only the reference and the purities, and says so).

## Row Level Security

Every table has RLS on. Privileges were revoked from `anon` and `authenticated` first, then granted narrowly, so RLS is the second lock, not the only one.

| Table | Public | Staff | Owner |
|---|---|---|---|
| stores, site_settings, karats | read | read | read + write |
| gold_prices | read | read + set price | + delete |
| gold_price_history | read | read | read |
| categories, products, product_images, articles, testimonials | read published/active | read all + write | same |
| leads | insert only, consent required | read + update | + delete |
| audit_log | — | read | read |
| admin_users | — | read | read + write |

Verified two ways: `npm run test:rls` (anonymous, via the public API) and `tests/rls/role-matrix.sql` (anonymous, signed-in non-admin, staff and owner, inside a transaction that rolls back).

**Rule for every future migration:** new tables must `revoke all on <table> from anon, authenticated`, grant only what is needed, `enable row level security`, and add policies that call `(select private.is_admin())` / `(select private.is_owner())`.

## Caching and "price updates in seconds"

Next.js Cache Components is on. Public reads are `use cache` functions tagged `prices`, `store`, `settings`, `products`. Pages are prerendered and served from the CDN.

The whole catalogue is one cached list (`getCatalogProducts`, tag `products`); filter, sort and paging happen in memory per request, which suits a single shop's catalogue (capped at 1,000 rows).

When an admin saves, the Server Action calls `updateTag('prices')`, which expires the cached entry immediately; the next visitor gets the new price. Between changes nothing hits the database.

`getPriceBoard()` also revalidates hourly so the "older than 24 hours" notice appears without anyone saving anything.

**Fixed-address pages versus `[slug]` pages.** Home, the price page and the calculator are fresh on the very next request after a save. A page with a variable address (`/katalog/[slug]`) gives the first visitor after a change the previous copy while a new one is built. So after a price or product save, `warmPaths()` re-requests the affected product pages from the server itself (after the admin's response is sent); customers then get the new estimate. It is best-effort: behind Vercel preview protection the self-request is refused and the page refreshes on its first real visit instead.

**Why there is no `[locale]` segment.** A dynamic language segment made every public page a variable-address page, with the stale-first behaviour above, and regenerating its generic shell at runtime failed. Static routes per language avoid both.

## Auth

- Supabase Auth: email + password, or a one-time email link with `shouldCreateUser: false` — no public sign-up, and the link form cannot be used to send mail to strangers.
- Product photos are resized in the admin's browser (max 1600 px, WebP, JPEG on Safari) and uploaded straight to Storage under the admin's own session; storage policies allow writes only for admins.
- Three layers for `/admin`: the proxy (redirect without a session), `requireAdmin()` in every page and Server Action (must be on the allowlist), and RLS in Postgres.
- The login form gives the same reply whether or not the email exists.

## i18n

Customer copy lives in `src/i18n/id.ts` (the source of truth for the shape) and `src/i18n/en.ts`; TypeScript fails the build if English is missing a key. Indonesian is served at plain URLs (`/harga-emas`), English under `/en` (`/en/harga-emas`), with the same Indonesian slugs. `localePath(locale, path)` builds every internal link; `localeAlternates()` emits `hreflang` and canonical tags, and the sitemap lists both languages. The admin and the articles are Indonesian only.

To add a page: write the view in `src/views`, then add a route file under both `src/app/(id)` and `src/app/en` (copy a neighbour). To add a language: add the dictionary, add it to `locales`, and add its route folder.

Money and weight are formatted by hand (`src/lib/format.ts`) rather than with `Intl.NumberFormat`, so the server and every phone browser render identical text (no hydration mismatch or layout shift). Dates use `Intl.DateTimeFormat` on the server only.

## Known limits

- One Supabase project serves development and previews. A separate production project comes before launch.
- Supabase free tier pauses after about a week without activity and has no backups.
- Vercel Hobby does not permit commercial sites.
- The one-time email link has not been exercised end to end (it needs a real inbox). Password sign-in is covered by the Playwright admin tests.
- No analytics provider is loaded yet; `track()` is a no-op until one is chosen.
- The public reservation form is limited in the database (3 per phone number and 60 in total per hour) and has a honeypot; there is no per-IP limit and no CAPTCHA.
- The 3D preview has only been exercised with a generated ring, not a scanned product model, and AR has not been tried on a phone.
- `/katalog/[slug]` for an unknown slug shows the not-found page but, when streamed to a browser, with HTTP 200. Crawlers get the full render.
