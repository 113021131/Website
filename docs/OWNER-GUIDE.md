# Panduan Pemilik — Toko Emas Sinar Mas

Panduan singkat untuk mengelola situs dari ponsel atau laptop. Semua dilakukan di halaman admin: buka `alamat-situs/admin`.

> Status: Fase 2. Harga, produk, reservasi, artikel, impor CSV, dan tampilan 3D sudah tersedia. "Coba Pakai" (try-on) menunggu pilihan vendor.

## 1. Masuk ke admin

1. Buka `/admin`. Anda akan diarahkan ke halaman masuk.
2. Isi **Email** dan **Kata sandi**, lalu ketuk **Masuk**.
3. Lupa kata sandi? Ketuk **Lupa kata sandi?**, isi email, lalu buka tautan yang dikirim ke email Anda.

Ada dua peran:

| Peran | Bisa melakukan |
|---|---|
| **Pemilik** | Semua: harga, produk, info toko, pengaturan |
| **Staf** | Mengubah harga, mengelola produk dan artikel, melihat dan menandai reservasi |

Selesai bekerja di perangkat bersama? Ketuk **Keluar** di kanan atas.

## 2. Memperbarui harga emas (setiap hari)

1. Buka **Harga**.
2. Setiap kadar punya dua kotak: **Harga jual** dan **Beli kembali**, dalam Rupiah per gram. Ketik angkanya; titik ribuan muncul sendiri.
3. Ketuk **Simpan & Terbitkan**. Muncul pesan **Harga tersimpan**, dan situs langsung menampilkan harga baru. Tidak perlu menunggu.

Hal yang perlu diketahui:

- **Tiap kadar diisi sendiri.** Situs tidak menghitung 22K dari 24K.
- **Situs akan bertanya dulu** bila harga beli kembali tidak lebih rendah dari harga jual, atau bila harga berubah lebih dari 5%. Periksa angkanya, lalu pilih **Ya, terbitkan** atau **Periksa lagi**. Ini mencegah salah ketik (misalnya kurang satu angka nol).
- **Naik atau turun bersamaan?** Buka **Naikkan atau turunkan semua**, isi persen (contoh `1,5` atau `-2`), ketuk **Terapkan ke semua**, periksa hasilnya, lalu **Simpan & Terbitkan**.
- **Riwayat perubahan** di bagian bawah mencatat setiap perubahan: waktu, kadar, harga, dan siapa yang mengubah.
- Bila harga tidak diperbarui lebih dari 24 jam, situs otomatis menampilkan: "Harga dapat berubah, mohon konfirmasi via WhatsApp."

## 2a. Rumus harga: satu harga acuan untuk semua (khusus pemilik)

Buka **Admin → Rumus harga**. Di sini Anda cukup mengisi **satu angka**: harga acuan emas 24K per gram. Situs lalu menghitung sendiri harga per gram tiap kadar dan perkiraan harga semua perhiasan.

1. Isi **Harga patokan pasar** (harga emas murni per gram dari sumber yang Anda percaya) dan, bila perlu, **Penyesuaian toko** dalam persen. Angka "Harga acuan yang dipakai" berubah saat Anda mengetik.
2. Periksa tabel **Kemurnian tiap kadar**. Harga per gram = harga acuan × kemurnian. Ubah persennya bila kadar toko Anda berbeda.
3. **Margin, pajak, dan beli kembali**: margin bawaan toko, pajak (biarkan 0 sampai Anda memastikan pajak yang berlaku), persen beli kembali, dan potongan per barang.
4. Lihat **Pratinjau pada katalog**: harga beberapa perhiasan sekarang dan sesudah disimpan.
5. Tekan **Simpan & hitung ulang**, baca peringatannya, lalu konfirmasi.

Catatan:

- Selama kotak "Ini angka simulasi" dicentang, situs menulis "Harga simulasi" di samping harga. Hapus centangnya setelah Anda mengisi harga toko yang sebenarnya.
- Perhiasan yang harganya Anda tetapkan sendiri tidak ikut berubah.
- Halaman **Harga** yang lama masih bisa dipakai untuk mengoreksi satu kadar, tetapi koreksi itu diganti lagi saat Rumus harga disimpan berikutnya.

## 2b. Mengganti desain konsep dengan stok toko

Dua belas perhiasan berlabel **Konsep** di katalog adalah desain contoh dengan harga ilustrasi, bukan stok toko. Untuk menggantinya:

1. Masukkan perhiasan Anda yang sebenarnya lewat **Admin → Produk** (satu per satu, atau dengan impor CSV), lengkap dengan foto asli.
2. Isi harga acuan toko di **Rumus harga** dan hapus centang "Ini angka simulasi".
3. Buka **Admin → Toko** dan matikan **Mode contoh**. Semua desain konsep dan label contoh langsung hilang dari situs; yang tampil hanya produk Anda.

## 3. Menambah produk

1. Buka **Produk** → **Tambah produk**.
2. Isi **Nama produk**, pilih **Kadar**, isi **Berat (gram)** (contoh `2,5`).
3. Pilih **Jenis ongkos** dan **Nilai ongkos**:
   - *Rupiah per gram*: ongkos = berat × nilai (bawaan toko)
   - *Rupiah per barang*: ongkos tetap
   - *Persen dari nilai emas*
4. **Status** tetap **Draf** dulu. Draf tidak terlihat oleh pengunjung.
5. Ketuk **Simpan produk**. Halaman berpindah ke halaman ubah produk, tempat Anda menambah foto.

Harga perhiasan dihitung otomatis: `berat × harga per gram + ongkos`, lalu dibulatkan ke atas ke Rp 1.000 terdekat. Saat harga emas berubah, harga semua perhiasan ikut berubah.

Pilihan lain di formulir:

- **Harga sesuai permintaan**: sembunyikan perkiraan harga; pengunjung diminta bertanya via WhatsApp.
- **Tampilkan di beranda**: produk muncul di "Pilihan dari etalase".
- **Ukuran tersedia**: pisahkan dengan koma, contoh `10, 12, 14`.
- **Status**: *Terbit* (tampil), *Terjual* atau *Stok habis* (tetap tampil, diberi tanda), *Draf* (disembunyikan).

### Detail tambahan dan harga

Di formulir produk, buka bagian **Detail tambahan dan harga** bila perlu:

- **Kode produk (SKU)**, **berat keseluruhan** (termasuk batu), dan keterangan **batu dan mutiara**.
- **Biaya batu dan bahan lain**: ditambahkan ke perkiraan harga sebagai baris tersendiri.
- **Margin toko untuk produk ini**: kosongkan untuk memakai margin bawaan di Rumus harga.
- **Harga ditetapkan manual**: bila diisi, situs menampilkan harga itu apa adanya dengan keterangan "Harga ditetapkan toko", dan harga tersebut tidak ikut berubah saat harga emas berubah. Kosongkan lagi untuk kembali ke perhitungan otomatis.
- **Nama dan deskripsi bahasa Inggris**: dipakai di halaman `/en`. Bila kosong, halaman Inggris menampilkan teks Indonesia.

## 4. Mengunggah foto

1. Di halaman ubah produk, bagian **Foto**, ketuk **Tambah foto** dan pilih satu atau beberapa foto dari galeri.
2. Foto diperkecil otomatis di ponsel sebelum diunggah, jadi tetap cepat walau sinyal lemah.
3. **Foto pertama menjadi foto utama.** Gunakan panah atas/bawah untuk mengubah urutan.
4. Isi **Keterangan foto** singkat (contoh: "Cincin polos tampak atas"). Ini membantu pembaca layar dan Google.
5. Setelah foto lengkap, ubah **Status** menjadi **Terbit** dan simpan.

Tips foto ada di `docs/OWNER-CHECKLIST.md`.

## 5. Mengunggah model 3D (opsional)

Di bagian **Model 3D**, pilih berkas `.glb` (dan `.usdz` untuk iPhone). Usahakan 1–3 MB; situs memberi peringatan di atas 5 MB. Produk yang punya model mendapat tab **Pratinjau 3D** di samping foto. Tab ini diberi label pratinjau; foto asli tetap menjadi acuan. Fitur bisa dimatikan di **Toko → Fitur → Tampilan 3D**.

## 6. Mengelola banyak produk

Di daftar **Produk**: centang beberapa produk, lalu ketuk **Terbitkan yang dipilih** atau **Jadikan draf**. **Gandakan** membuat salinan sebagai draf (tanpa foto), berguna untuk model yang mirip.

**Impor CSV (untuk mengisi katalog pertama kali):** ketuk **Impor CSV**, unduh contoh berkasnya, isi di Excel atau Google Sheets, simpan sebagai CSV, lalu pilih berkasnya. Situs menunjukkan baris mana yang siap dan mana yang perlu diperbaiki sebelum Anda mengimpor. Semua produk masuk sebagai **Draf**: tambahkan foto, lalu terbitkan.

## 7. Info toko dan pengaturan (khusus pemilik)

Buka **Toko**. Yang diisi di sini langsung tampil di situs; yang dikosongkan tidak ditampilkan.

- **Kontak**: isi **Nomor WhatsApp** (contoh `081234567890`). Sebelum diisi, tombol WhatsApp di situs belum berfungsi.
- **Lokasi** dan **Jam buka**: tampil di halaman Toko dan dibaca Google.
- **Teks kepercayaan**: kebijakan beli kembali dan tukar tambah, sertifikat, cerita toko. Tulis hanya yang benar.
- **Harga dan ongkos**: aturan pembulatan dan ongkos bawaan untuk produk baru.
- **Mode contoh**: matikan setelah harga dan produk asli terisi, agar pemberitahuan "data contoh" hilang.
- **Daftar kadar**: nonaktifkan kadar yang tidak dijual, atau tambah kadar baru.

## 8. Membaca reservasi

Pengunjung dapat mengetuk **Reservasi ambil di toko** di halaman produk. Reservasinya muncul di **Reservasi**:

1. Tiap kartu berisi nama, nomor telepon, produk, rencana tanggal datang, dan catatan.
2. Ketuk nomornya untuk menelepon, atau **Chat WhatsApp** untuk membalas.
3. Ubah **status** menjadi *Dihubungi*, lalu *Selesai* setelah barang diambil.
4. **Unduh CSV** menyimpan semua reservasi ke satu berkas.
5. Pemilik dapat **menghapus** reservasi. Lakukan bila pelanggan meminta datanya dihapus.

Satu nomor telepon hanya bisa mengirim 3 reservasi per jam; ini mencegah penyalahgunaan.

## 9. Menulis artikel

1. Buka **Artikel**. Tiga kerangka artikel sudah disiapkan sebagai **Draf**; draf tidak terlihat pengunjung.
2. Buka salah satu, lengkapi bagian bertanda `[ISI: …]`, dan tulis ulang dengan gaya Anda sendiri.
3. Isi artikel memakai format sederhana: `## Subjudul`, `- butir daftar`, `**tebal**`.
4. Ubah **Status** menjadi **Terbit** dan simpan. Artikel muncul di halaman Artikel.

Tulis hanya fakta yang benar tentang toko.

## Bila ada masalah

| Masalah | Yang dilakukan |
|---|---|
| "Email atau kata sandi salah." | Periksa ejaan email; gunakan **Lupa kata sandi?** |
| "Akun ini tidak punya akses admin." | Email belum didaftarkan oleh pemilik |
| "Harga gagal disimpan. Coba lagi." | Periksa koneksi internet, lalu simpan ulang |
| Harga di situs belum berubah | Muat ulang halaman; bila masih lama, hubungi pengembang |
| Foto gagal diunggah | Coba satu foto dulu; pastikan berkasnya JPG, PNG, atau WebP |
