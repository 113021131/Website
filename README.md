# Toko Sinar Mas — website

Website for a gold jewellery shop in Indonesia: today's gold price per gram, a jewellery catalogue, and a phone-friendly admin for the owner. Customer-facing copy is Bahasa Indonesia.

**Status: Phase 1 (MVP) built.** Public pages, catalogue and the admin (prices, products, store) work against demo data. Not yet deployed. Phase 2 adds the 3D viewer, calculators, reservations, articles, English and the price-history chart.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres, Auth, Storage, Row Level Security. Migrations in `supabase/migrations`
- Zod, Vitest (unit + RLS), Playwright + axe (end-to-end + accessibility)
- npm, Node 22 or newer

## Setup

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill `.env.local` with the project URL and **publishable** key from Supabase → Project Settings → API, then:

```bash
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key. Public by design; RLS protects the data |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash. `TODO_OWNER`: production domain |

The Supabase service-role/secret key is **not used** by this app. Never add it to the client or commit it.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route type generation + `tsc --noEmit` |
| `npm run test` | Unit tests (price formula, formatting) |
| `npm run test:rls` | Proves a logged-out visitor cannot write or read private tables (runs against the real project) |
| `npm run test:e2e` | Playwright at 360 px and desktop, with axe accessibility checks. Run `npm run build` first; first time also `npx playwright install chromium` |
| `npm run check` | lint + typecheck + unit tests + build |
| `node scripts/seed-demo.mjs` | Create or refresh the 12 DEMO products (`--remove` deletes them) |
| `node scripts/break-ui-check.mjs` | Measure the worst-case stress page at `/dev/break-ui` (dev server running) |

## Giving someone admin access

There is no public sign-up. Sign-in is by email and password (or a one-time email link), and only for accounts the owner created.

1. Supabase dashboard → Authentication → Users → **Add user** (tick "Auto Confirm User") with the person's email.
2. SQL editor: `insert into public.admin_users (email, role) values ('name@example.com', 'owner');` (`'staff'` for staff).
3. Supabase → Authentication → URL Configuration: add `http://localhost:3000/admin/auth/confirm` and the production equivalent to the redirect allow-list.
4. They open `/admin/login` and sign in with the password you set, or use "Lupa kata sandi?" to get a one-time link.

A test admin (`e2e-admin@tokosinarmas.test`, owner role) exists for the automated admin tests; its password is only in the git-ignored `.env.local`. **Delete it before launch** (Supabase → Authentication → Users, and its row in `admin_users`).

Roles: `owner` can do everything; `staff` can update prices, edit products and view leads. **Turn on MFA for the owner account** (Supabase → Authentication → Multi-factor) before launch.

Supabase's built-in email sender is limited to a few emails per hour and is for testing only; set up custom SMTP before launch.

## Database changes

Schema changes go in a new file in `supabase/migrations` and are applied from that file (Supabase CLI `supabase db push`, or the Supabase MCP `apply_migration`). Never edit tables by hand in the dashboard. New tables must `revoke all … from anon, authenticated`, grant only what is needed, and enable RLS — see `docs/ARCHITECTURE.md`.

After a schema change, regenerate `src/lib/supabase/database.types.ts`.

## Placeholders

Every shop fact not yet supplied by the owner is the literal marker `TODO_OWNER`:

```bash
grep -rn "TODO_OWNER" src supabase docs README.md
```

The UI treats a `TODO_OWNER` value as missing and shows a neutral fallback. Gold prices currently in the database are **made-up demo numbers** (`supabase/seed/demo_prices.sql`); `site_settings.demo_mode = true` keeps a notice on the site saying so.

## More

- `DESIGN.md` — tokens, typography, components, tone of voice
- `docs/ARCHITECTURE.md` — data model, caching, auth, security rules
- `docs/OWNER-GUIDE.md` — step-by-step admin guide in Bahasa Indonesia
- `docs/OWNER-CHECKLIST.md` — Google Business Profile, WhatsApp Business, reviews, photos, pre-launch list
