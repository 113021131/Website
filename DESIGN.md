# Toko Sinar Mas — design system

Status: **proposal, Phase 0.** No logo or brand colours were supplied, so everything here is proposed and open to change. The homepage hero has three directions in the prototype picker (`/prototypes/hero`); this file describes what all three share.

## 1. Where the look comes from

A toko emas has its own visual world, and the site borrows from it rather than from generic "luxury":

| In the shop | On the site |
|---|---|
| Gold laid out on a maroon velvet tray | **Beludru** maroon is the brand colour; gold only ever sits on it or beside it as an accent |
| The price board behind the counter | The live price board/strip is the first thing on the home page |
| The handwritten *surat emas* (nota) with ruled lines and a stamp | Dotted leaders, ruled rows and a stamped "Diperbarui" time for price data |
| The hallmark punched into every piece (750, 999, maker's mark) | A small "SM" hallmark cartouche as the proposed mark |
| A shopkeeper's ledger | **Besley**, a Clarendon — the sturdy letter of ledgers and shop signs — for headings and big prices |

Feeling: warm, established, clear. Not fashion-luxury (no hairline serifs, no black-and-gold), not a template.

## 2. Principles

1. **The price is the hero.** Today's price per gram is visible without scrolling at 360 px wide, always with its "Diperbarui" time.
2. **Gold is an accent, never a text colour on white.** Bright gold fails contrast on white, so it is used for rules, fills and on maroon. Text-on-light uses the darker `gold-ink`.
3. **Real photos are the truth.** No effects on product imagery. 3D is labelled as a preview.
4. **One thumb, one hand, mid-range Android.** 48 px touch targets, 16 px minimum body text, no hover-only behaviour, nothing that shifts layout after load.
5. **Say it plainly.** Short Indonesian sentences, the shop speaking politely to a customer.

## 3. Tokens

Three layers, all CSS variables in `src/app/globals.css`. Components use **semantic** or **component** tokens only; primitives never appear in component code.

```
Primitive (raw value)  →  Semantic (purpose)  →  Component (one component's needs)
--beludru-800          →  --brand             →  --price-board-bg
```

### 3.1 Primitive colours

| Token | Hex | Note |
|---|---|---|
| `--beludru-950` | `#2E0710` | deepest maroon |
| `--beludru-900` | `#4A0C1A` | tray |
| `--beludru-800` | `#5E0F1F` | **brand** |
| `--beludru-700` | `#7A1A2C` | hover |
| `--beludru-100` / `-50` | `#F6E4E6` / `#FBF3F4` | tints |
| `--emas-300` | `#F0CF7A` | gold on maroon |
| `--emas-400` | `#E0B341` | gold rules, fills |
| `--emas-500` | `#C9992A` | |
| `--emas-700` | `#8A6410` | gold text/icons on light |
| `--emas-50` | `#FBF5E6` | gold tint surface |
| `--kertas-0` / `-50` | `#FFFFFF` / `#F7F4F0` | paper |
| `--tinta-900` | `#1F1517` | ink (body text) |
| `--tinta-600` | `#5B4E50` | secondary text |
| `--tinta-400` | `#948A88` | input borders (3:1 on white) |
| `--tinta-300` / `-200` | `#CFC6C4` / `#E6DFDC` | leaders, dividers |
| `--hijau-wa-700` / `-800` | `#0F7A5B` / `#0B6149` | WhatsApp button and its hover |
| `--kuning-50` / `-900` | `#FFF4D6` / `#6B4A00` | notices |
| `--merah-600` | `#B3261E` | errors (kept distinct from brand maroon) |
| `--hijau-700` | `#1E6B3A` | success |

### 3.2 Semantic colours

| Token | Maps to | Use |
|---|---|---|
| `--background` / `--foreground` | kertas-0 / tinta-900 | page and body text |
| `--surface-muted` | kertas-50 | alternate sections |
| `--surface-tint` | emas-50 | price strip, highlights |
| `--brand` / `--brand-deep` / `--brand-hover` / `--brand-foreground` | beludru 800 / 900 / 700 / white | primary buttons, price board |
| `--gold` | emas-400 | rules, icons on dark, fills |
| `--gold-ink` | emas-700 | gold-coloured text or icons on light |
| `--gold-bright` | emas-300 | gold text on maroon |
| `--whatsapp` / `--whatsapp-hover` | hijau-wa 700 / 800 | WhatsApp actions only |
| `--notice` / `--notice-foreground` | kuning 50 / 900 | "harga dapat berubah", demo data |
| `--muted-foreground` | tinta-600 | captions, meta |
| `--border` / `--input` | tinta-200 / tinta-400 | dividers / form field borders |
| `--ring` | brand (gold-bright inside `.on-dark`) | keyboard focus |
| `--destructive` / `--success` | merah-600 / hijau-700 | errors / confirmations |

The shadcn/ui variables (`--primary`, `--secondary`, `--accent`, `--card`, …) are aliases of these, so shadcn components pick the theme up unchanged.

### 3.3 Contrast (WCAG 2.1 AA, calculated)

| Pair | Ratio | Passes |
|---|---|---|
| ink on white | 17.0 : 1 | AAA |
| secondary text (tinta-600) on white | 7.9 : 1 | AAA |
| white on brand maroon | 13.4 : 1 | AAA |
| gold-bright on brand maroon | 8.9 : 1 | AAA |
| gold-ink on white | 5.4 : 1 | AA |
| white on WhatsApp green | 5.3 : 1 | AA |
| notice text on notice background | 7.5 : 1 | AAA |
| input border (tinta-400) on white | 3.4 : 1 | AA for UI components |

Bright gold (`--gold`) on white is 1.9 : 1 and is **never** used for text.

### 3.4 Component tokens

| Component | Tokens |
|---|---|
| Price board | `--price-board-bg`, `-fg`, `-muted`, `-rule`, `-accent` |
| Price strip | `--price-strip-bg`, `-fg`, `-border` |
| Nota (receipt-style panel) | `--nota-bg`, `--nota-edge`, `--nota-leader` |
| Product tray | `--tray-bg`, `--tray-card-bg` |
| Buttons and inputs | `--button-height`, `--input-height` (both 48 px) |

### 3.5 Typography

| Role | Family | Why |
|---|---|---|
| Display: headings, large prices | **Besley** (variable, 400–900) | Clarendon: ledger and shop-sign letterforms, sturdy at small sizes on low-density screens |
| Text and UI | **Plus Jakarta Sans** (variable) | Drawn in Indonesia for Jakarta; open, very readable in Bahasa Indonesia |

Both load through `next/font` (self-hosted, Latin subset, `display: swap`). All prices and weights use the `price` utility: tabular lining figures, no wrapping.

Scale (mobile first, 1.2 ratio rounded to whole pixels):

| Token | Size / line height | Use |
|---|---|---|
| caption | 12 / 16 | legal and meta only, never body |
| small | 14 / 20 | labels, table headers |
| body | 16 / 26 | default |
| lead | 18 / 28 | intro paragraphs |
| h3 | 20 / 26 | |
| h2 | 24 / 30 | |
| h1 | 30 / 34 (36 / 40 from 768 px) | |
| price-xl | 36 / 40 | the one headline number on a screen |

Body line length stays under about 70 characters. Headings use `text-wrap: balance`.

### 3.6 Spacing, radius, elevation

- Spacing: 4 px base — 4, 8, 12, 16, 24, 32, 48, 64, 96 (`--space-1` … `--space-24`). Page gutter 16 px, respecting safe-area insets. Content max width 72 rem.
- Radius carries meaning, not one value everywhere: `sm` 2 px for paper-like things (nota, price rows), `md` 6 px for buttons and inputs, `lg` 10 px for product cards, `xl` 16 px for the velvet tray.
- Elevation: borders first. One soft shadow is reserved for things that really float (menus, toasts).

### 3.7 Motion

- Durations 150 / 200 / 250 ms, easing `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out). Only `transform` and `opacity` animate.
- Motion answers an action (opening the price list, switching karat, a toast). No scroll-reveal decoration.
- `prefers-reduced-motion` turns everything off.
- Numbers never animate: a price that counts up looks like a price that is changing.

## 4. Components (specification)

| Component | Default | Pressed / hover | Focus | Disabled |
|---|---|---|---|---|
| Primary button | brand bg, white text, 48 px tall, radius md | brand-hover (hover only on real pointers), scale 0.98 while pressed | 2 px ring, 2 px offset | muted bg, muted text |
| WhatsApp button | whatsapp bg, white text + WhatsApp glyph, 48 px | whatsapp-hover | same ring | shown as a notice when the number is missing |
| Secondary button | 1 px ink border, transparent | surface-muted | same ring | muted |
| Input | 48 px, 1 px `--input` border, 16 px text, visible label above | — | ring + border brand | muted bg |
| Price row | karat code in display type; amounts right-aligned, tabular | — | — | — |
| Notice | notice bg/fg, icon + text, radius sm | — | — | — |
| Product card | photo 4:5, name (2 lines max, then ellipsis), karat and weight, estimated price, WhatsApp action | — | ring on the whole card link | "Terjual" / "Stok habis" badge, photo dimmed, still visible |

States every data component must have: loading (skeleton that reserves the final height), empty, error, and stale (price older than 24 hours).

## 5. Proposed mark

Wordmark "Toko Sinar Mas" in Besley 600, with an "SM" hallmark cartouche (rounded rectangle, 1.5 px gold-ink outline) as the compact mark and favicon. A placeholder until the owner supplies or approves a logo.

## 6. Tone of voice (Bahasa Indonesia)

- Address the customer as **Anda**; the shop is **kami**. Polite, warm, never stiff ("Silakan", not "Dimohon untuk").
- Short sentences. One idea each.
- Be exact about money: always "per gram", always "perkiraan" for estimates, always say what is not included (ongkos).
- Buttons say what happens: "Tanya via WhatsApp", "Lihat katalog", "Simpan & Terbitkan". The toast repeats the verb: "Harga tersimpan".
- Errors say what to do next: "Masukkan berat dalam gram, misalnya 2,5."
- Never promise what is unverified: no "termurah", "terpercaya sejak …", "bersertifikat" unless the owner supplies the fact.

| Instead of | Write |
|---|---|
| Submit | Kirim |
| Error! Input tidak valid | Masukkan berat dalam gram, misalnya 2,5. |
| Hubungi kami sekarang juga!!! | Tanya via WhatsApp |
| Harga terbaik se-Indonesia | Harga hari ini, per gram |

## 7. Sources and limits

- Rules applied from the `design-system`, `ui-ux-pro-max` and `frontend-design` skills. The `ui-ux-pro-max` search database and the `design-system` reference files were not present in this install, so only their SKILL.md guidance was used; the palette and font pairing are reasoned for this shop, not pulled from a database.
- Contrast ratios are calculated from the hex values, and re-checked with axe in the browser during each phase.
