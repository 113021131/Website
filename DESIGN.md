# Toko Sinar Mas — design system

Status: **revision 2, 16 Nov 2026.** The owner asked for a premium boutique look: warm ivory, champagne gold as an accent, deep charcoal, an elegant serif for headings. This replaces the maroon "beludru" direction of revision 1. Still no logo, so the mark in §5 remains a placeholder.

## 1. Where the look comes from

A jeweller's boutique: pale walls, one dark counter, gold only where the eye should go.

| In the boutique | On the site |
|---|---|
| Ivory walls and display stands | Ivory page, white cards, soft beige for alternate bands |
| The dark counter the trays are set on | Charcoal for the price board, page title bands, footer and primary buttons |
| Gold itself | Champagne gold only as an accent: thin rules, eyebrows, one gold button on the home hero |
| The price board behind the counter | Today's 24K price in a slim strip above the header on every page; the full board is the second section of the home page |
| The handwritten *surat emas* | Every estimate is itemised like a receipt: gold value, workmanship, stones, margin, total |

Feeling: calm, exact, expensive without shouting. Not black-and-gold, not gradients, not a template.

## 2. Principles

1. **The price is always in view.** Today's 24K price per gram sits in the strip above the header on every page; the full board, with its "Diperbarui" time, is the second section of the home page.
2. **Gold is an accent, never a text colour on white.** Bright gold fails contrast on white, so it is used for rules, fills and on charcoal. Text-on-light uses the darker `gold-ink`.
3. **Real photos are the truth.** No effects on product imagery. 3D is labelled as a preview.
4. **One thumb, one hand, mid-range Android.** 48 px touch targets, 16 px minimum body text, no hover-only behaviour, nothing that shifts layout after load.
5. **Say it plainly.** Short Indonesian sentences, the shop speaking politely to a customer.

## 3. Tokens

Three layers, all CSS variables in `src/app/globals.css`. Components use **semantic** or **component** tokens only; primitives never appear in component code.

```
Primitive (raw value)  →  Semantic (purpose)  →  Component (one component's needs)
--arang-900            →  --brand             →  --price-board-bg
```

### 3.1 Primitive colours

| Token | Hex | Note |
|---|---|---|
| `--arang-950` / `-900` / `-800` / `-700` | `#171512` / `#25221E` / `#38342E` / `#4C463E` | charcoal: ink and dark surfaces (900 is the owner's "deep charcoal") |
| `--sampanye-400` | `#C6A15B` | **champagne gold**, the accent |
| `--sampanye-300` / `-200` | `#DCC591` / `#E8D9B8` | gold on charcoal |
| `--sampanye-500` / `-700` | `#AB8640` / `#7A5C20` | 700 is gold-coloured text and icons on light |
| `--sampanye-50` | `#F3ECDD` | gold tint surface |
| `--gading-0` / `-50` | `#FFFFFF` / `#F8F5EF` | white cards / **warm ivory** page |
| `--gading-200` / `-300` | `#EAE3D8` / `#DDD4C5` | **soft beige** bands / dividers |
| `--abu-300` / `-500` / `-700` | `#CFC8BC` / `#8C8377` / `#5F584E` | muted text on charcoal / input borders / secondary text |
| `--hijau-wa-700` / `-800` | `#0F7A5B` / `#0B6149` | WhatsApp button and its hover |
| `--kuning-50` / `-900` | `#F4E8C9` / `#5C4300` | notices, "Konsep" badges |
| `--merah-600` | `#B3261E` | errors |
| `--hijau-700` | `#1E6B3A` | success |

### 3.2 Semantic colours

| Token | Maps to | Use |
|---|---|---|
| `--background` / `--foreground` | gading-50 / arang-900 | page and body text |
| `--card` | gading-0 | product cards, panels, form fields |
| `--surface-muted` | gading-200 | alternate sections, skeletons |
| `--surface-tint` | sampanye-50 | highlights, photo stand-ins |
| `--brand` / `--brand-deep` / `--brand-hover` / `--brand-foreground` | arang 900 / 950 / 800 / gading-50 | primary buttons, price board, title bands, footer |
| `--gold` | sampanye-400 | rules, the hero button, borders that mark something important |
| `--gold-ink` | sampanye-700 | gold-coloured text or icons on light |
| `--gold-bright` | sampanye-300 | gold text on charcoal |
| `--whatsapp` / `--whatsapp-hover` | hijau-wa 700 / 800 | WhatsApp actions only |
| `--notice` / `--notice-foreground` | kuning 50 / 900 | demo data, concept designs, "harga dapat berubah" |
| `--muted-foreground` | abu-700 | captions, meta |
| `--border` / `--input` | gading-300 / abu-500 | dividers / form field borders |
| `--ring` | brand (gold-bright inside `.on-dark`) | keyboard focus |

The shadcn/ui variables (`--primary`, `--secondary`, `--accent`, …) are aliases of these.

### 3.3 Contrast (WCAG 2.1 AA, calculated)

| Pair | Ratio | Passes |
|---|---|---|
| ink on ivory | 14.6 : 1 | AAA |
| secondary text on ivory / on soft beige | 6.4 : 1 / 5.5 : 1 | AA |
| ivory on charcoal | 14.6 : 1 | AAA |
| gold-bright on charcoal | 9.4 : 1 | AAA |
| muted text on charcoal | 9.5 : 1 | AAA |
| gold-ink on ivory / white / gold tint | 5.7 / 6.2 / 5.3 : 1 | AA |
| charcoal on champagne gold (hero button) | 6.5 : 1 | AA |
| WhatsApp green on ivory (outline button) | 4.9 : 1 | AA |
| white on WhatsApp green | 5.3 : 1 | AA |
| notice text on notice background | 7.6 : 1 | AAA |
| input border on white | 3.7 : 1 | AA for UI components |

Champagne gold (`--gold`) on ivory is 2.2 : 1 and is **never** used for text. Re-checked with axe on every public page by the end-to-end tests.

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
| Display: headings, large prices | **Playfair Display** (variable, 400–900, with italic) | A high-contrast transitional serif: reads as fine jewellery, and its italic gives the hero one gold accent phrase. Headings sit at weight 500 so the thin strokes survive on low-density phone screens |
| Text and UI | **Plus Jakarta Sans** (variable) | Unchanged: drawn in Indonesia, open and very readable in Bahasa Indonesia |

Section titles carry an "eyebrow" above them (the `eyebrow` utility): 12 px spaced capitals in gold-ink with a short rule.

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
- Radius is deliberately tight, like the corners of a jeweller's card: `sm` 2 px, `md` 3 px for buttons, inputs and product cards, `lg` 4 px, `xl` 6 px. Nothing is pill-shaped. Content max width 76 rem.
- Elevation: borders first. One soft shadow is reserved for things that really float (menus, toasts).

### 3.7 Motion

- Durations 150 / 200 / 250 ms, easing `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out). Only `transform` and `opacity` animate.
- Motion answers an action (opening the price list, switching karat, a toast). No scroll-reveal decoration.
- `prefers-reduced-motion` turns everything off.
- Numbers never animate: a price that counts up looks like a price that is changing.

## 4. Components (specification)

| Component | Default | Pressed / hover | Focus | Disabled |
|---|---|---|---|---|
| Primary button | charcoal bg, ivory text, 48 px tall, radius md. The home hero alone uses the gold button | brand-hover (hover only on real pointers), scale 0.98 while pressed | 2 px ring, 2 px offset | muted bg, muted text |
| WhatsApp button | whatsapp bg, white text + WhatsApp glyph, 48 px | whatsapp-hover | same ring | shown as a notice when the number is missing |
| Secondary button | 1 px ink border, transparent | surface-muted | same ring | muted |
| Input | 48 px, 1 px `--input` border, 16 px text, visible label above | — | ring + border brand | muted bg |
| Price row | karat code in display type; amounts right-aligned, tabular | — | — | — |
| Notice | notice bg/fg, icon + text, radius sm | — | — | — |
| Product card | square photo on white, category eyebrow, name (2 lines max, then ellipsis), karat and net gold weight, estimated price in display type; "Konsep" or "Contoh" badge on anything that is not real stock | — | ring on the whole card link | "Terjual" / "Stok habis" badge, photo dimmed, still visible |

States every data component must have: loading (skeleton that reserves the final height), empty, error, and stale (price older than 24 hours).

## 5. Proposed mark

Wordmark "Toko Sinar Mas" in Playfair Display 600, with an "SM" hallmark cartouche (rounded rectangle, 1.5 px gold-ink outline) as the compact mark and favicon. A placeholder until the owner supplies or approves a logo.

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
