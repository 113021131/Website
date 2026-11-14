# Panduan Pemilik — Toko Sinar Mas

Panduan singkat untuk mengelola situs dari ponsel atau laptop. Semua dilakukan di halaman admin: buka `alamat-situs/admin`.

> Status: Fase 1. Reservasi (leads), artikel, kalkulator, dan tampilan 3D dibangun pada Fase 2; bagiannya di bawah diberi tanda.

## 1. Masuk ke admin

1. Buka `/admin`. Anda akan diarahkan ke halaman masuk.
2. Isi **Email** dan **Kata sandi**, lalu ketuk **Masuk**.
3. Lupa kata sandi? Ketuk **Lupa kata sandi?**, isi email, lalu buka tautan yang dikirim ke email Anda.

Ada dua peran:

| Peran | Bisa melakukan |
|---|---|
| **Pemilik** | Semua: harga, produk, info toko, pengaturan |
| **Staf** | Mengubah harga, mengelola produk |

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

## 4. Mengunggah foto

1. Di halaman ubah produk, bagian **Foto**, ketuk **Tambah foto** dan pilih satu atau beberapa foto dari galeri.
2. Foto diperkecil otomatis di ponsel sebelum diunggah, jadi tetap cepat walau sinyal lemah.
3. **Foto pertama menjadi foto utama.** Gunakan panah atas/bawah untuk mengubah urutan.
4. Isi **Keterangan foto** singkat (contoh: "Cincin polos tampak atas"). Ini membantu pembaca layar dan Google.
5. Setelah foto lengkap, ubah **Status** menjadi **Terbit** dan simpan.

Tips foto ada di `docs/OWNER-CHECKLIST.md`.

## 5. Mengunggah model 3D (opsional, tampil di Fase 2)

Di bagian **Model 3D**, pilih berkas `.glb` (dan `.usdz` untuk iPhone). Usahakan 1–3 MB; situs memberi peringatan di atas 5 MB. Tampilan 3D baru aktif setelah Fase 2 dan setelah fitur **Tampilan 3D** dinyalakan di **Toko**.

## 6. Mengelola banyak produk

Di daftar **Produk**: centang beberapa produk, lalu ketuk **Terbitkan yang dipilih** atau **Jadikan draf**. **Gandakan** membuat salinan sebagai draf (tanpa foto), berguna untuk model yang mirip.

## 7. Info toko dan pengaturan (khusus pemilik)

Buka **Toko**. Yang diisi di sini langsung tampil di situs; yang dikosongkan tidak ditampilkan.

- **Kontak**: isi **Nomor WhatsApp** (contoh `081234567890`). Sebelum diisi, tombol WhatsApp di situs belum berfungsi.
- **Lokasi** dan **Jam buka**: tampil di halaman Toko dan dibaca Google.
- **Teks kepercayaan**: kebijakan beli kembali dan tukar tambah, sertifikat, cerita toko. Tulis hanya yang benar.
- **Harga dan ongkos**: aturan pembulatan dan ongkos bawaan untuk produk baru.
- **Mode contoh**: matikan setelah harga dan produk asli terisi, agar pemberitahuan "data contoh" hilang.
- **Daftar kadar**: nonaktifkan kadar yang tidak dijual, atau tambah kadar baru.

## 8. Membaca reservasi (Fase 2)

Halaman **Reservasi** akan menampilkan nama, nomor telepon, tanggal pilihan, dan catatan dari pengunjung, dengan status *baru / dihubungi / selesai*. Belum tersedia di Fase 1.

## Bila ada masalah

| Masalah | Yang dilakukan |
|---|---|
| "Email atau kata sandi salah." | Periksa ejaan email; gunakan **Lupa kata sandi?** |
| "Akun ini tidak punya akses admin." | Email belum didaftarkan oleh pemilik |
| "Harga gagal disimpan. Coba lagi." | Periksa koneksi internet, lalu simpan ulang |
| Harga di situs belum berubah | Muat ulang halaman; bila masih lama, hubungi pengembang |
| Foto gagal diunggah | Coba satu foto dulu; pastikan berkasnya JPG, PNG, atau WebP |
