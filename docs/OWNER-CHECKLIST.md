# Daftar Periksa Pemilik — Toko Sinar Mas

Hal-hal di luar kode yang menentukan apakah situs mendatangkan pelanggan. Centang satu per satu.

**English summary:** (1) claim and complete the Google Business Profile; (2) keep name, address and phone identical everywhere; (3) set up WhatsApp Business with a catalogue and quick replies; (4) ask every happy customer for a Google review using your review card; (5) shoot consistent product photos; (6) collect 3D models only for the 10–20 best sellers; (7) before launch: real prices, real products, legal review, paid plans, remove the test admin, turn on indexing.

## 1. Google Business Profile (Profil Bisnis Google)

- [ ] Klaim atau buat profil di <https://business.google.com> dengan nama toko persis seperti di papan nama.
- [ ] Kategori utama: **Toko perhiasan**. Tambahan: **Pembeli emas** bila toko menerima beli kembali.
- [ ] Isi alamat, pin peta yang tepat di pintu toko, jam buka (termasuk hari libur), nomor telepon dan WhatsApp.
- [ ] Tautkan situs. Tautkan juga halaman harga: `…/harga-emas`.
- [ ] Unggah minimal 10 foto: tampak depan, etalase, interior, produk unggulan, pemilik atau staf.
- [ ] Buat **postingan** saat ada koleksi baru atau menjelang Lebaran, Imlek, dan musim nikah.
- [ ] Jawab setiap ulasan dan pertanyaan, yang baik maupun yang buruk.

## 2. Nama, alamat, telepon yang sama di semua tempat

Google mencocokkan data toko dari banyak sumber. Perbedaan kecil ("Jl." vs "Jalan", nomor lama) menurunkan kepercayaan.

- [ ] Tentukan satu penulisan baku untuk nama, alamat, dan nomor.
- [ ] Samakan di: situs (**Admin → Toko**), Profil Bisnis Google, Instagram, Facebook, TikTok, WhatsApp Business, marketplace, dan kartu nama.
- [ ] Setiap kali ada perubahan, perbarui semuanya pada hari yang sama.

## 3. WhatsApp Business

- [ ] Pasang **WhatsApp Business** (bukan WhatsApp biasa) pada nomor toko.
- [ ] Isi profil: nama, alamat, jam buka, tautan situs.
- [ ] **Pesan sambutan** dan **pesan di luar jam buka**.
- [ ] **Balasan cepat** untuk pertanyaan yang sering: harga hari ini, cara beli kembali, lokasi.
- [ ] **Label** untuk percakapan: baru, menunggu, reservasi, selesai.
- [ ] Masukkan nomor di **Admin → Toko → Nomor WhatsApp**. Pesan dari situs sudah berisi nama produk, kadar, berat, dan perkiraan harga.

## 4. Meminta ulasan Google

- [ ] Minta ulasan tepat setelah transaksi selesai, saat pelanggan masih di toko.
- [ ] Gunakan kartu ulasan Anda (proyek kartu ulasan yang sudah ada). Masukkan tautannya di **Admin → Toko → Tautan kartu ulasan**. `TODO_OWNER`
- [ ] Masukkan tautan ulasan Google di **Admin → Toko → Tautan ulasan Google** agar tombolnya tampil di situs.
- [ ] Jangan memberi imbalan untuk ulasan dan jangan menulis ulasan sendiri; keduanya melanggar aturan Google.
- [ ] Ulasan yang ditampilkan di situs harus asli dan menyertakan tautan sumbernya.

## 5. Panduan memotret produk

- [ ] **Cahaya**: dekat jendela, siang hari, tanpa lampu kilat. Hindari bayangan keras.
- [ ] **Latar**: satu latar polos yang sama untuk semua produk (misalnya beludru merah marun atau putih gading).
- [ ] **Posisi**: potret tegak (4:5). Produk di tengah, memenuhi sekitar dua pertiga bingkai.
- [ ] **Jumlah**: minimal 3 foto per produk: tampak depan, tampak samping, saat dipakai atau di samping penggaris.
- [ ] **Fokus**: ketuk layar pada perhiasan sebelum memotret; bersihkan lensa.
- [ ] **Jujur**: tanpa filter warna. Foto adalah acuan pelanggan; warna emas harus seperti aslinya.
- [ ] Opsional: video pendek 10–15 detik, perhiasan diputar perlahan.

## 6. Mengumpulkan model 3D

- [ ] Mulai dari 10–20 model terlaris saja.
- [ ] Minta berkas `.glb` (dan `.usdz` untuk iPhone) dari jasa pemindaian atau pembuat model. Ukuran 1–3 MB per berkas.
- [ ] Model 3D diberi label "pratinjau" di situs; foto asli tetap menjadi acuan.

## 7. Statistik kunjungan (analytics)

Situs sudah mencatat kejadian penting (klik WhatsApp, kunjungan halaman harga) tanpa data pribadi, tetapi **penyedia statistik belum dipilih**. `TODO_OWNER`

- [ ] Pilih satu: Vercel Web Analytics, Plausible, atau Umami. Tanyakan ke pengembang; sebagian berbayar.

## 8. Sebelum situs diluncurkan

- [ ] Harga emas asli terisi; **Mode contoh** dimatikan.
- [ ] Produk contoh dihapus (`node scripts/seed-demo.mjs --remove`); produk asli dengan foto asli terbit.
- [ ] Semua `TODO_OWNER` terisi: alamat, jam buka, WhatsApp, domain, logo.
- [ ] Kebijakan privasi serta syarat dan ketentuan ditinjau oleh penasihat hukum (saat ini masih draf).
- [ ] Kebijakan beli kembali dan tukar tambah ditulis di **Admin → Toko**.
- [ ] Akun admin pemilik dibuat; **verifikasi dua langkah (MFA)** dinyalakan untuk pemilik.
- [ ] Akun uji `e2e-admin@tokosinarmas.test` dihapus dari Supabase.
- [ ] Pengirim email (SMTP) sendiri dipasang untuk tautan masuk.
- [ ] Paket berbayar diputuskan: Vercel Pro (situs komersial) dan Supabase Pro (cadangan data, tidak dijeda).
- [ ] Domain dipasang; `NEXT_PUBLIC_SITE_URL` diisi; `NEXT_PUBLIC_ALLOW_INDEXING=true` agar Google boleh mengindeks.
- [ ] Situs didaftarkan di Google Search Console dan sitemap `…/sitemap.xml` dikirim.
