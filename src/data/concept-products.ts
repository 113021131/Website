/**
 * The concept collection: twelve fictional designs that fill the catalogue until
 * the shop's real inventory is entered. They are NOT stock, their prices are
 * illustrative, and the site says so wherever one appears.
 *
 * They are shown only while `site_settings.demo_mode` is on (Admin → Toko →
 * "Mode contoh"). Turn that off and they disappear; real products come from the
 * `products` table, whose columns mirror the fields below.
 *
 * Prices are never stored here. Selling price and buyback value are calculated
 * from the weight, karat, workmanship, material cost and markup with the live
 * 24K reference (src/lib/pricing).
 *
 * Photos: see scripts/process-concept-images.mjs. Some are placeholder photos
 * supplied by the owner; each product's text was written to match its photo.
 */

export type ConceptSpec = {
  label_id: string;
  label_en: string;
  value_id: string;
  value_en: string;
};

export type ConceptProduct = {
  /** Negative, so it can never collide with a database id. */
  id: number;
  sku: string;
  slug: string;
  name_id: string;
  name_en: string;
  description_id: string;
  description_en: string;
  /** Slug of a row in `categories`. */
  category: "cincin" | "kalung" | "gelang" | "anting" | "mas-kawin";
  gold_karat: "24K" | "22K" | "18K" | "17K" | "14K";
  gross_weight_grams: number;
  net_gold_weight_grams: number;
  available_sizes: string[];
  occasions: string[];
  gemstone_details_id: string | null;
  gemstone_details_en: string | null;
  workmanship: { type: "per_gram" | "fixed"; value: number };
  material_cost_idr: number;
  /** Null = the site-wide default markup. */
  markup_percentage: number | null;
  specs: ConceptSpec[];
  is_featured: boolean;
  is_bestseller_demo: boolean;
  is_demo: true;
  availability_status: "concept";
  /** Folder under public/images/products and the brief the photo is generated from. */
  image_folder: "rings" | "necklaces" | "bracelets" | "earrings" | "wedding";
  image_prompt: string;
  created_at: string;
  updated_at: string;
};

const STAMP = "2026-11-16T00:00:00.000Z";
const BASE = {
  is_demo: true,
  availability_status: "concept",
  created_at: STAMP,
  updated_at: STAMP,
} as const;

/** Shared look for every product photo, so the catalogue reads as one studio shoot. */
export const IMAGE_STYLE =
  "Photorealistic luxury jewellery product photograph, professional studio lighting with soft diffused key light and gentle reflections, " +
  "polished yellow gold with believable metal texture and physically plausible construction, shallow depth of field, " +
  "seamless warm ivory and soft beige studio background, subtle natural shadow, square 1:1 composition, product centred, " +
  "ultra sharp detail, 85mm macro lens. No text, no logo, no watermark, no price tag, no hands unless stated.";

export const HERO_IMAGE_PROMPT =
  "Photorealistic wide 16:9 luxury jewellery campaign photograph: a woman's hand resting on warm ivory silk, wearing a polished yellow gold " +
  "solitaire ring and a fine gold link bracelet, soft window light from the left, shallow depth of field, warm ivory and champagne tones, " +
  "generous empty space on the left third for a headline, elegant and calm. No text, no logo, no watermark.";

const spec = (label_id: string, label_en: string, value_id: string, value_en: string): ConceptSpec => ({
  label_id,
  label_en,
  value_id,
  value_en,
});

export const CONCEPT_PRODUCTS: ConceptProduct[] = [
  {
    ...BASE,
    id: -1,
    sku: "SM-CN-001",
    slug: "cincin-kirana-solitaire",
    name_id: "Cincin Kirana Solitaire",
    name_en: "Kirana Solitaire Ring",
    description_id:
      "Cincin solitaire dengan satu batu di tengah yang dipegang empat cakar ramping. Lingkar cincin dibuat tipis dan membulat agar nyaman dipakai setiap hari.",
    description_en:
      "A solitaire ring with a single centre stone held by four slim claws. The band is slender and softly rounded, comfortable enough for every day.",
    category: "cincin",
    gold_karat: "18K",
    gross_weight_grams: 3.35,
    net_gold_weight_grams: 3.2,
    available_sizes: ["10", "11", "12", "13", "14", "15", "16"],
    occasions: ["hadiah", "pernikahan"],
    gemstone_details_id: "1 zirkonia putih potongan bulat, 5 mm (bukan berlian)",
    gemstone_details_en: "1 round-cut white cubic zirconia, 5 mm (not a diamond)",
    workmanship: { type: "fixed", value: 650_000 },
    material_cost_idr: 150_000,
    markup_percentage: null,
    specs: [
      spec("Lebar lingkar", "Band width", "1,8 mm", "1.8 mm"),
      spec("Ikatan batu", "Setting", "Empat cakar", "Four-claw"),
      spec("Permukaan", "Finish", "Poles mengilap", "High polish"),
    ],
    is_featured: true,
    is_bestseller_demo: true,
    image_folder: "rings",
    image_prompt:
      "A slim yellow gold solitaire ring with one round brilliant white stone in a four-claw setting, standing upright at a three-quarter angle on a smooth ivory stone plinth.",
  },
  {
    ...BASE,
    id: -2,
    sku: "SM-CN-002",
    slug: "cincin-arunika-polos",
    name_id: "Cincin Arunika Polos",
    name_en: "Arunika Plain Band",
    description_id:
      "Cincin polos berprofil setengah bulat dengan kilau penuh. Bentuk klasik yang cocok dipakai sendiri atau ditumpuk dengan cincin lain.",
    description_en:
      "A plain half-round band with a full mirror polish. A classic shape that works alone or stacked with other rings.",
    category: "cincin",
    gold_karat: "22K",
    gross_weight_grams: 4,
    net_gold_weight_grams: 4,
    available_sizes: ["10", "12", "14", "16", "18", "20"],
    occasions: ["sehari-hari", "lebaran"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 120_000 },
    material_cost_idr: 0,
    markup_percentage: 6,
    specs: [
      spec("Lebar lingkar", "Band width", "3,5 mm", "3.5 mm"),
      spec("Profil", "Profile", "Setengah bulat", "Half-round"),
      spec("Permukaan", "Finish", "Poles mengilap", "High polish"),
    ],
    is_featured: false,
    is_bestseller_demo: true,
    image_folder: "rings",
    image_prompt:
      "A plain half-round yellow gold band ring, 3.5 mm wide, mirror polished, lying at a slight angle on ivory linen with a soft reflection along its curve.",
  },
  {
    ...BASE,
    id: -3,
    sku: "SM-CN-003",
    slug: "cincin-sekar-melati",
    name_id: "Cincin Sekar Melati",
    name_en: "Sekar Jasmine Ring",
    description_id:
      "Terinspirasi kuntum melati. Lima kelopak emas mengelilingi satu batu kecil, dengan lingkar cincin berukir halus di kedua sisinya.",
    description_en:
      "Inspired by the jasmine bud. Five gold petals surround one small stone, with fine engraving along both shoulders of the band.",
    category: "cincin",
    gold_karat: "17K",
    gross_weight_grams: 2.95,
    net_gold_weight_grams: 2.8,
    available_sizes: ["9", "10", "11", "12", "13", "14"],
    occasions: ["hadiah", "sehari-hari"],
    gemstone_details_id: "1 zirkonia putih 3 mm di tengah kelopak",
    gemstone_details_en: "1 white cubic zirconia, 3 mm, at the centre of the petals",
    workmanship: { type: "fixed", value: 520_000 },
    material_cost_idr: 60_000,
    markup_percentage: null,
    specs: [
      spec("Diameter hiasan", "Motif diameter", "9 mm", "9 mm"),
      spec("Lebar lingkar", "Band width", "1,6 mm", "1.6 mm"),
      spec("Permukaan", "Finish", "Poles dan ukir halus", "Polished with fine engraving"),
    ],
    is_featured: false,
    is_bestseller_demo: false,
    image_folder: "rings",
    image_prompt:
      "A delicate yellow gold ring with a five-petal jasmine flower motif and one tiny white stone at its centre, fine engraved shoulders, resting on a beige ceramic dish.",
  },
  {
    ...BASE,
    id: -4,
    sku: "SM-KL-001",
    slug: "kalung-larasati-pilin",
    name_id: "Kalung Larasati Pilin",
    name_en: "Larasati Twist Necklace",
    description_id:
      "Rantai pipih yang dipilin sehingga menangkap cahaya dari setiap sisi. Panjang 45 cm, jatuh tepat di bawah tulang selangka.",
    description_en:
      "A flat chain twisted so that it catches the light from every side. At 45 cm it sits just below the collarbone.",
    category: "kalung",
    gold_karat: "18K",
    gross_weight_grams: 7.2,
    net_gold_weight_grams: 7.2,
    available_sizes: ["42 cm", "45 cm", "50 cm"],
    occasions: ["sehari-hari", "hadiah"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 160_000 },
    material_cost_idr: 0,
    markup_percentage: null,
    specs: [
      spec("Panjang", "Length", "45 cm", "45 cm"),
      spec("Lebar rantai", "Chain width", "3 mm", "3 mm"),
      spec("Pengait", "Clasp", "Lobster", "Lobster clasp"),
    ],
    is_featured: true,
    is_bestseller_demo: true,
    image_folder: "necklaces",
    image_prompt:
      "A twisted flat herringbone yellow gold chain necklace with a lobster clasp, draped over the corner of a matte ivory cube, soft shadow beneath.",
  },
  {
    ...BASE,
    id: -5,
    sku: "SM-KL-002",
    slug: "kalung-nirmala-hati",
    name_id: "Kalung Nirmala Hati",
    name_en: "Nirmala Heart Necklace",
    description_id:
      "Rantai halus dengan liontin hati menggembung yang berukir motif berlian, sehingga berkilau dari setiap sudut. Ringan dan manis untuk hadiah.",
    description_en:
      "A fine chain carrying a puffed heart pendant with diamond-cut engraving, so it sparkles from every angle. Light and sweet, made for gifting.",
    category: "kalung",
    gold_karat: "18K",
    gross_weight_grams: 4.1,
    net_gold_weight_grams: 4.1,
    available_sizes: ["40 cm", "42 cm + 3 cm"],
    occasions: ["hadiah", "sehari-hari"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "fixed", value: 620_000 },
    material_cost_idr: 0,
    markup_percentage: null,
    specs: [
      spec("Panjang", "Length", "42 cm, dapat diperpanjang 3 cm", "42 cm with a 3 cm extender"),
      spec("Tinggi liontin", "Pendant height", "14 mm", "14 mm"),
      spec("Pengait", "Clasp", "Cincin pegas", "Spring ring"),
    ],
    is_featured: true,
    is_bestseller_demo: false,
    image_folder: "necklaces",
    image_prompt:
      "A fine yellow gold cable chain necklace with a puffed heart pendant covered in sparkling diamond-cut engraving, laid in a soft curve on ivory silk.",
  },
  {
    ...BASE,
    id: -6,
    sku: "SM-KL-003",
    slug: "kalung-swarna-padat",
    name_id: "Kalung Swarna Padat",
    name_en: "Swarna Solid Chain",
    description_id:
      "Rantai padat emas 24 karat dengan mata rantai rata yang rapat. Dibuat untuk Anda yang mengutamakan kadar dan berat emasnya.",
    description_en:
      "A solid 24-karat chain with close, flat links. Made for those who value the purity and the weight of the gold itself.",
    category: "kalung",
    gold_karat: "24K",
    gross_weight_grams: 10,
    net_gold_weight_grams: 10,
    available_sizes: ["45 cm", "50 cm", "55 cm"],
    occasions: ["pernikahan", "imlek"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 70_000 },
    material_cost_idr: 0,
    markup_percentage: 4,
    specs: [
      spec("Panjang", "Length", "50 cm", "50 cm"),
      spec("Lebar rantai", "Chain width", "3,2 mm", "3.2 mm"),
      spec("Pengait", "Clasp", "Kait S", "S-hook"),
    ],
    is_featured: false,
    is_bestseller_demo: false,
    image_folder: "necklaces",
    image_prompt:
      "A solid rich yellow 24 karat gold curb chain necklace with close flat links and an S-hook clasp, coiled neatly on a beige stone slab.",
  },
  {
    ...BASE,
    id: -7,
    sku: "SM-GL-001",
    slug: "gelang-dahayu-rantai",
    name_id: "Gelang Dahayu Rantai",
    name_en: "Dahayu Bead Chain Bracelet",
    description_id:
      "Gelang rantai bola yang halus dengan manik-manik emas berukir berlian di sela-selanya. Ringan di pergelangan dan berkilau saat tangan bergerak.",
    description_en:
      "A fine ball chain bracelet with diamond-cut gold beads spaced along it. Light on the wrist, it sparkles as the hand moves.",
    category: "gelang",
    gold_karat: "17K",
    gross_weight_grams: 2.2,
    net_gold_weight_grams: 2.2,
    available_sizes: ["16 cm", "17 cm", "18 cm"],
    occasions: ["sehari-hari", "hadiah"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 150_000 },
    material_cost_idr: 0,
    markup_percentage: null,
    specs: [
      spec("Panjang", "Length", "17 cm", "17 cm"),
      spec("Manik", "Beads", "9 manik berukir, 4 mm", "9 diamond-cut beads, 4 mm"),
      spec("Pengait", "Clasp", "Lobster", "Lobster clasp"),
    ],
    is_featured: true,
    is_bestseller_demo: true,
    image_folder: "bracelets",
    image_prompt:
      "A fine yellow gold ball chain bracelet with nine small diamond-cut gold beads spaced along it and a lobster clasp, laid in a loose circle on warm ivory linen.",
  },
  {
    ...BASE,
    id: -8,
    sku: "SM-GL-002",
    slug: "gelang-kemilau-keroncong",
    name_id: "Gelang Kemilau Keroncong",
    name_en: "Kemilau Bangle",
    description_id:
      "Gelang keroncong bulat dengan ukiran garis berlian yang memantulkan cahaya saat tangan bergerak. Bagian dalamnya dipoles halus.",
    description_en:
      "A round bangle with diamond-cut line engraving that flashes as the hand moves. The inside is polished smooth.",
    category: "gelang",
    gold_karat: "22K",
    gross_weight_grams: 12,
    net_gold_weight_grams: 12,
    available_sizes: ["5,6 cm", "5,8 cm", "6,0 cm"],
    occasions: ["lebaran", "pernikahan", "imlek"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 110_000 },
    material_cost_idr: 0,
    markup_percentage: 6,
    specs: [
      spec("Diameter dalam", "Inner diameter", "5,8 cm", "5.8 cm"),
      spec("Lebar", "Width", "4 mm", "4 mm"),
      spec("Permukaan", "Finish", "Ukir garis berlian", "Diamond-cut engraving"),
    ],
    is_featured: false,
    is_bestseller_demo: false,
    image_folder: "bracelets",
    image_prompt:
      "A round rich yellow gold bangle, 4 mm wide, with fine diamond-cut line engraving around the outside, standing upright against a second identical bangle lying flat, ivory backdrop.",
  },
  {
    ...BASE,
    id: -9,
    sku: "SM-AT-001",
    slug: "anting-candramaya-bulat",
    name_id: "Anting Candramaya Bulat",
    name_en: "Candramaya Hoop Earrings",
    description_id:
      "Sepasang anting bulat kecil berukir motif berlian yang berkilau, masing-masing dengan bandul hati mungil yang bergoyang. Kunci engselnya rapat dan tidak terlihat dari luar.",
    description_en:
      "A pair of small hoops with a sparkling diamond-cut texture, each with a tiny heart charm that sways. The hinged closure sits tight and out of sight.",
    category: "anting",
    gold_karat: "18K",
    gross_weight_grams: 1.9,
    net_gold_weight_grams: 1.9,
    available_sizes: [],
    occasions: ["hadiah", "sehari-hari"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "fixed", value: 380_000 },
    material_cost_idr: 0,
    markup_percentage: null,
    specs: [
      spec("Diameter luar", "Outer diameter", "14 mm", "14 mm"),
      spec("Bandul", "Charm", "Hati 4 mm", "4 mm heart"),
      spec("Kunci", "Closure", "Engsel klik", "Hinged click"),
    ],
    is_featured: true,
    is_bestseller_demo: true,
    image_folder: "earrings",
    image_prompt:
      "A pair of small yellow gold hinged hoop earrings with a sparkling diamond-cut texture, each with a tiny puffed heart charm hanging below, lying side by side on a matte ivory surface.",
  },
  {
    ...BASE,
    id: -10,
    sku: "SM-AT-002",
    slug: "anting-ayunda-tusuk",
    name_id: "Anting Ayunda Tusuk",
    name_en: "Ayunda Stud Earrings",
    description_id:
      "Anting tusuk mungil dengan satu batu merah muda dalam bingkai emas bulat. Kecil dan rapi untuk dipakai setiap hari, juga cocok untuk anak.",
    description_en:
      "Tiny stud earrings, each a single pink stone in a round gold bezel. Small and neat for every day, and suitable for children too.",
    category: "anting",
    gold_karat: "14K",
    gross_weight_grams: 0.85,
    net_gold_weight_grams: 0.8,
    available_sizes: [],
    occasions: ["sehari-hari", "anak", "hadiah"],
    gemstone_details_id: "2 zirkonia merah muda potongan bulat, 3 mm",
    gemstone_details_en: "2 round pink cubic zirconia, 3 mm",
    workmanship: { type: "fixed", value: 260_000 },
    material_cost_idr: 40_000,
    markup_percentage: null,
    specs: [
      spec("Diameter", "Diameter", "4 mm", "4 mm"),
      spec("Ikatan batu", "Setting", "Bingkai penuh", "Full bezel"),
      spec("Pengait", "Fitting", "Tusuk dengan kupu-kupu", "Post with butterfly back"),
    ],
    is_featured: false,
    is_bestseller_demo: false,
    image_folder: "earrings",
    image_prompt:
      "A pair of tiny yellow gold stud earrings, each a round 3 mm pink stone in a full bezel with a post and butterfly back, resting on natural ivory linen.",
  },
  {
    ...BASE,
    id: -11,
    sku: "SM-MK-001",
    slug: "cincin-kawin-janji-suci",
    name_id: "Sepasang Cincin Kawin Janji Suci",
    name_en: "Janji Suci Wedding Band Pair",
    description_id:
      "Sepasang cincin kawin berprofil rata dengan tepi membulat. Cincin wanita diberi lima batu kecil berderet, cincin pria dibiarkan polos dengan sapuan satin.",
    description_en:
      "A pair of flat-profile wedding bands with softened edges. Hers carries a row of five small stones; his is left plain with a satin brush.",
    category: "mas-kawin",
    gold_karat: "18K",
    gross_weight_grams: 7.6,
    net_gold_weight_grams: 7.5,
    available_sizes: ["Wanita 9–15", "Pria 16–22"],
    occasions: ["pernikahan"],
    gemstone_details_id: "5 zirkonia putih 1,3 mm pada cincin wanita",
    gemstone_details_en: "5 white cubic zirconia, 1.3 mm, on her band",
    workmanship: { type: "fixed", value: 950_000 },
    material_cost_idr: 90_000,
    markup_percentage: null,
    specs: [
      spec("Lebar cincin wanita", "Her band width", "3 mm", "3 mm"),
      spec("Lebar cincin pria", "His band width", "4,5 mm", "4.5 mm"),
      spec("Ukir nama", "Engraving", "Dapat diukir di sisi dalam", "Can be engraved inside"),
    ],
    is_featured: true,
    is_bestseller_demo: true,
    image_folder: "wedding",
    image_prompt:
      "A pair of yellow gold wedding bands, the narrower one with a row of five small white stones and the wider one plain with a satin brushed finish, leaning against each other on ivory silk.",
  },
  {
    ...BASE,
    id: -12,
    sku: "SM-MK-002",
    slug: "set-mas-kawin-anindya",
    name_id: "Set Mas Kawin Anindya",
    name_en: "Anindya Bridal Set",
    description_id:
      "Satu set untuk hari pernikahan: kalung dengan hiasan bunga di tengah, sepasang anting senada, dan cincin. Dikerjakan dengan ukiran kerawang yang ringan.",
    description_en:
      "One set for the wedding day: a necklace with a floral centrepiece, matching earrings and a ring, finished in light openwork filigree.",
    category: "mas-kawin",
    gold_karat: "22K",
    gross_weight_grams: 18.5,
    net_gold_weight_grams: 18.5,
    available_sizes: ["Kalung 42 cm", "Cincin 10–16"],
    occasions: ["pernikahan"],
    gemstone_details_id: null,
    gemstone_details_en: null,
    workmanship: { type: "per_gram", value: 140_000 },
    material_cost_idr: 0,
    markup_percentage: 7,
    specs: [
      spec("Isi set", "Set contains", "Kalung, sepasang anting, cincin", "Necklace, pair of earrings, ring"),
      spec("Panjang kalung", "Necklace length", "42 cm", "42 cm"),
      spec("Teknik", "Technique", "Kerawang", "Openwork filigree"),
    ],
    is_featured: false,
    is_bestseller_demo: false,
    image_folder: "wedding",
    image_prompt:
      "A matching yellow gold bridal jewellery set with light openwork filigree: a necklace with a floral centrepiece, a pair of small drop earrings and a ring, arranged on an ivory velvet display bust and tray.",
  },
];
