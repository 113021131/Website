import type { PricedProduct } from "@/lib/catalog";
import type { PriceBoard, Store } from "@/lib/data/public";
import { storageUrl } from "@/lib/storage";

/**
 * Dev-only fixtures for the break-ui stress page. "demo" is kind data; "worst"
 * is the realistic worst case for every value the catalogue card, price table
 * and store block render. Kept as the regression set for those components.
 */
export type Dataset = "demo" | "worst" | "empty" | "one";
export const DATASETS: Dataset[] = ["demo", "worst", "empty", "one"];

function product(
  overrides: Partial<Omit<PricedProduct, "estimate">> & { id: number; name: string; totalIdr?: number | null },
): PricedProduct {
  const { totalIdr = 6_825_000, ...rest } = overrides;
  const weightG = rest.weightG ?? 3.5;
  const total = totalIdr;
  return {
    slug: `fixture-${overrides.id}`,
    description: null,
    weightG,
    karatCode: "22K",
    karatLabel: "Emas 22 Karat",
    categorySlug: "cincin",
    categoryName: "Cincin",
    sizeOptions: [],
    occasions: [],
    labourFeeType: "per_gram",
    labourFeeValue: 150_000,
    priceOnRequest: false,
    status: "published",
    isFeatured: false,
    isDemo: false,
    videoUrl: null,
    modelGlbUrl: null,
    modelUsdzUrl: null,
    tryonEnabled: false,
    tryonAssetRef: null,
    publishedAt: null,
    updatedAt: "2026-11-14T00:00:00Z",
    images: [{ url: storageUrl("product-images", "demo/demo-cincin-polos-22k-1.webp"), alt: "", width: 1000, height: 1250 }],
    ...rest,
    estimate:
      total === null
        ? null
        : {
            weightMg: Math.round(weightG * 1000),
            pricePerGramIdr: 1_800_000,
            goldValueIdr: total,
            labourFeeIdr: 0,
            subtotalIdr: total,
            roundingAdjustmentIdr: 0,
            totalIdr: total,
          },
  };
}

const board = (rows: PriceBoard["rows"], extra: Partial<PriceBoard> = {}): PriceBoard => ({
  rows,
  updatedAt: "2026-11-14T02:30:00Z",
  timeZone: "Asia/Jakarta",
  isStale: false,
  isDemo: false,
  ...extra,
});

const demoRows: PriceBoard["rows"] = [
  { karatCode: "24K", karatLabel: "Emas 24 Karat", sellIdr: 2_000_000, buybackIdr: 1_900_000 },
  { karatCode: "22K", karatLabel: "Emas 22 Karat", sellIdr: 1_800_000, buybackIdr: 1_650_000 },
  { karatCode: "18K", karatLabel: "Emas 18 Karat", sellIdr: 1_500_000, buybackIdr: 1_350_000 },
];

const baseStore = {
  id: 1,
  slug: "utama",
  name: "Toko Sinar Mas",
  tagline: null,
  address: "Jl. Contoh No. 1",
  city: "Kota Contoh",
  province: null,
  postal_code: null,
  landmarks: null,
  maps_url: null,
  latitude: null,
  longitude: null,
  phone: null,
  whatsapp: null,
  email: null,
  opening_hours: null,
  social_links: {},
  google_review_url: null,
  is_primary: true,
  created_at: "2026-11-14T00:00:00Z",
  updated_at: "2026-11-14T00:00:00Z",
} satisfies Store;

export const FIXTURES: Record<Dataset, { products: PricedProduct[]; board: PriceBoard; store: Store }> = {
  demo: {
    products: [
      product({ id: 1, name: "Cincin Polos" }),
      product({ id: 2, name: "Kalung Liontin Hati", karatCode: "18K", weightG: 4.2, totalIdr: 7_140_000 }),
      product({ id: 3, name: "Gelang Rantai", karatCode: "17K", weightG: 6.75, totalIdr: 10_260_000 }),
      product({ id: 4, name: "Anting Bulat", karatCode: "17K", weightG: 1.2, totalIdr: 1_860_000 }),
    ],
    board: board(demoRows),
    store: baseStore,
  },
  worst: {
    products: [
      // Long wedding-set name with a full description in the title, sold, demo-flagged: two badges at once.
      product({
        id: 11,
        name: "Set Perhiasan Pengantin Lengkap: Kalung, Gelang, Cincin Sepasang, dan Anting dengan Ukiran Nama Mempelai serta Kotak Beludru",
        status: "sold",
        isDemo: true,
        weightG: 87.125,
        karatCode: "24K",
        totalIdr: 1_234_567_000,
      }),
      // Tiny weight beside a tiny price, one-word name, no photo.
      product({ id: 12, name: "Giwang", weightG: 0.001, karatCode: "16K", images: [], totalIdr: 2_000 }),
      // Unbreakable model code as the name; price on request.
      product({ id: 13, name: "SM-CINCIN-MATASATU-18K-PESANANKHUSUS-2026/0001234", priceOnRequest: true, totalIdr: null }),
      // Heaviest weight the column allows, Rp 100 miliar+, out of stock, photo URL that 404s.
      product({
        id: 14,
        name: "Kalung",
        weightG: 99_999.999,
        karatCode: "24K",
        status: "out_of_stock",
        images: [{ url: storageUrl("product-images", "does-not-exist.webp"), alt: "", width: 1000, height: 1250 }],
        totalIdr: 199_999_998_000,
      }),
      // Markup in a name must render as text.
      product({ id: 15, name: "Cincin <b>Emas</b> & Berlian “Solitaire”", weightG: 12.5, totalIdr: 104_500_000 }),
      // Newline and repeated spaces in the name.
      product({ id: 16, name: "Gelang   Keroncong\nIsi 6", karatCode: "22K", weightG: 0.1, totalIdr: 215_000 }),
    ],
    board: board(
      [
        { karatCode: "24K", karatLabel: "Emas 24 Karat", sellIdr: 12_345_678_000, buybackIdr: 11_999_999_000 },
        { karatCode: "22K", karatLabel: "Emas 22 Karat", sellIdr: 1_800_000, buybackIdr: 1_650_000 },
        { karatCode: "18K", karatLabel: "Emas 18 Karat", sellIdr: 999, buybackIdr: 0 },
        { karatCode: "9K", karatLabel: "Emas 9 Karat", sellIdr: 1_000_000, buybackIdr: 1_000_000 },
        { karatCode: "17K", karatLabel: "Emas 17 Karat", sellIdr: 1_400_000, buybackIdr: 1_250_000 },
        { karatCode: "16K", karatLabel: "Emas 16 Karat", sellIdr: 1_300_000, buybackIdr: 1_150_000 },
        { karatCode: "14K", karatLabel: "Emas 14 Karat", sellIdr: 1_100_000, buybackIdr: 950_000 },
        { karatCode: "10K", karatLabel: "Emas 10 Karat", sellIdr: 800_000, buybackIdr: 650_000 },
      ],
      { isStale: true, isDemo: true, updatedAt: "2026-01-01T17:05:00Z", timeZone: "Asia/Jayapura" },
    ),
    store: {
      ...baseStore,
      name: "Toko Emas & Perhiasan Sinar Mas Jaya Abadi Sentosa",
      tagline: "Menerima pesanan khusus, tukar tambah, beli kembali, reparasi, cuci, dan ukir nama sejak dahulu",
      address:
        "Kompleks Pertokoan Pasar Raya Sejahtera Blok C-12 No. 45A Lantai Dasar (seberang pintu masuk utama, sebelah apotek), Jl. Jenderal Besar Abdul Haris Nasution RT 003/RW 011, Kelurahan Sukamaju Baru, Kecamatan Tanjung Karang Pusat",
      city: "Kota Administrasi Bandar Lampung",
      province: "Lampung",
    },
  },
  empty: { products: [], board: board([]), store: { ...baseStore, address: null, city: null } },
  one: {
    products: [product({ id: 21, name: "Cincin Polos" })],
    board: board([demoRows[0]], { updatedAt: null }),
    store: baseStore,
  },
};
