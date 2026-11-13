/**
 * Bahasa Indonesia copy. This is the source dictionary; other locales must match
 * its shape (see `Dictionary` in ./index.ts). Customer-facing text lives here,
 * never inline in components.
 */
export const id = {
  common: {
    brand: "Toko Sinar Mas",
    menu: "Menu",
    closeMenu: "Tutup menu",
    comingSoon: "Segera hadir",
    skipToContent: "Langsung ke isi",
  },
  nav: {
    prices: "Harga Emas",
    catalog: "Katalog",
    calculator: "Kalkulator",
    services: "Layanan",
    trust: "Kepercayaan",
    store: "Toko",
  },
  price: {
    title: "Harga emas hari ini",
    perGram: "per gram",
    perGramShort: "/gram",
    karat: "Kadar",
    sell: "Harga jual",
    buyback: "Beli kembali",
    sellHint: "Harga saat Anda membeli",
    buybackHint: "Harga saat Anda menjual kembali",
    updated: "Diperbarui",
    stale: "Harga dapat berubah, mohon konfirmasi via WhatsApp.",
    demo: "Angka contoh untuk melihat tampilan. Bukan harga toko.",
    empty: "Harga hari ini belum diisi. Silakan tanya langsung via WhatsApp.",
    unit: "Harga dalam Rupiah per gram.",
    showAll: "Semua harga",
    hideAll: "Tutup",
    estimateNote: "Perkiraan dari harga hari ini.",
  },
  cta: {
    whatsapp: "Tanya via WhatsApp",
    catalog: "Lihat katalog",
    jewellery: "Lihat perhiasan",
    whatsappMissing: "Nomor WhatsApp toko belum diisi.",
  },
  whatsappMessage: {
    price: "Halo {brand}, saya ingin bertanya tentang harga emas hari ini.",
    estimate:
      "Halo {brand}, saya ingin tanya emas {karat} seberat {weight}. Perkiraan di situs: {amount} (harga {updated}).",
  },
  home: {
    board: {
      lead: "Harga per gram untuk tiap kadar, diperbarui langsung dari toko.",
    },
    showcase: {
      title: "Perhiasan emas untuk dipakai, dihadiahkan, dan disimpan.",
      lead: "Lihat koleksi, cek harga hari ini, lalu tanya langsung lewat WhatsApp.",
      trayTitle: "Pilihan dari etalase",
      sample: "Contoh",
      photoPlaceholder: "Foto produk",
    },
    estimator: {
      title: "Hitung dulu, baru datang ke toko.",
      lead: "Pilih kadar dan masukkan berat. Kami tampilkan perkiraan nilainya dari harga hari ini.",
      panelTitle: "Harga hari ini",
      karatLabel: "Kadar emas",
      weightLabel: "Berat (gram)",
      weightHint: "Contoh: 2,5",
      weightError: "Masukkan berat dalam gram, misalnya 2,5.",
      result: "Perkiraan nilai emas",
      excludes: "Belum termasuk ongkos pembuatan. Harga akhir dikonfirmasi di toko.",
      resultEmpty: "Masukkan berat untuk melihat perkiraan.",
    },
    categories: {
      title: "Cari berdasarkan jenis",
      items: {
        cincin: "Cincin",
        kalung: "Kalung",
        gelang: "Gelang",
        anting: "Anting",
      },
    },
  },
  admin: {
    title: "Admin Toko Sinar Mas",
    login: {
      title: "Masuk ke admin",
      lead: "Masukkan email yang terdaftar. Kami kirim tautan masuk ke email tersebut.",
      emailLabel: "Email",
      submit: "Kirim tautan masuk",
      submitting: "Mengirim…",
      sent: "Jika email terdaftar, tautan masuk sudah kami kirim. Periksa kotak masuk Anda.",
      invalidEmail: "Masukkan alamat email yang benar.",
      rateLimited: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.",
      noAccess: "Akun ini tidak punya akses admin. Hubungi pemilik toko.",
      linkExpired: "Tautan masuk tidak berlaku lagi. Minta tautan baru.",
    },
    dashboard: {
      signedInAs: "Masuk sebagai",
      roles: { owner: "Pemilik", staff: "Staf" },
      signOut: "Keluar",
      sectionsTitle: "Bagian admin",
      sections: {
        harga: "Harga emas",
        produk: "Produk",
        toko: "Info toko",
        leads: "Reservasi",
        artikel: "Artikel",
      },
      phaseNote: "Dibangun pada fase berikutnya.",
      ownerOnly: "Bagian itu hanya untuk pemilik toko.",
    },
  },
} as const;
