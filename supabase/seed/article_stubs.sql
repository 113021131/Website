-- Three article stubs: outlines only, status = draft, so nothing is public.
-- The owner fills in the facts marked [ISI: …], rewrites in their own voice, then publishes.
-- Structure follows a standard guide: keyword in the title and slug, a short intro,
-- three to five sections, a closing with one call to action, and a summary under 160 characters.

insert into public.articles (slug, title, excerpt, status, body_md) values
(
  'cara-menghitung-harga-perhiasan-emas',
  'Cara Menghitung Harga Perhiasan Emas',
  'Harga perhiasan emas dihitung dari berat, harga per gram sesuai kadar, dan ongkos pembuatan. Ini cara menghitungnya, lengkap dengan contoh.',
  'draft',
  $md$> DRAF KERANGKA. Lengkapi bagian bertanda [ISI: …] sebelum diterbitkan.

Kata kunci utama: cara menghitung harga perhiasan emas. Kata kunci pendukung: harga emas per gram, ongkos pembuatan, harga emas hari ini.

## Pembuka (100–150 kata)

- Masalah pembaca: dua cincin dengan berat sama bisa berbeda harga, dan itu membingungkan.
- Janji artikel: setelah membaca, pembaca bisa menghitung sendiri perkiraan harga.
- Tautkan ke halaman [Harga Emas Hari Ini](/harga-emas).

## Rumus dasar harga perhiasan

- Harga = berat (gram) × harga per gram + ongkos pembuatan.
- Jelaskan tiap unsur dalam satu kalimat.

## Harga per gram berbeda untuk tiap kadar

- Mengapa 24K, 22K, dan 18K punya harga sendiri.
- Tautkan ke penjelasan kadar di halaman [Kepercayaan](/kepercayaan#kadar).

## Apa itu ongkos pembuatan

- Mengapa model yang rumit ongkosnya lebih tinggi.
- [ISI: cara toko menghitung ongkos, misalnya per gram atau per barang]

## Contoh hitungan

- Satu contoh dengan angka bulat, langkah demi langkah.
- [ISI: contoh nyata dari toko, atau arahkan pembaca ke kalkulator]
- Tautkan ke [Kalkulator](/kalkulator).

## Yang perlu ditanyakan sebelum membeli

- Berat pasti, kadar, ongkos, dan surat emas.

## Penutup (75–100 kata)

- Rangkum rumus dalam satu kalimat.
- Ajakan: cek harga hari ini, lalu tanya via WhatsApp.
$md$
),
(
  'perbedaan-emas-24k-22k-18k',
  'Perbedaan Emas 24K, 22K, dan 18K',
  'Emas 24K, 22K, dan 18K berbeda pada kandungan emas murni, kekerasan, warna, dan harga. Kenali bedanya agar tidak salah pilih.',
  'draft',
  $md$> DRAF KERANGKA. Lengkapi bagian bertanda [ISI: …] sebelum diterbitkan.

Kata kunci utama: perbedaan emas 24K 22K 18K. Kata kunci pendukung: kadar emas, emas murni, emas untuk perhiasan.

## Pembuka (100–150 kata)

- Pertanyaan pembaca: mana yang sebaiknya dibeli?
- Jawaban singkat: tergantung tujuan, untuk dipakai atau disimpan.

## Apa arti kadar

- Kadar dihitung per 24 bagian. 24K hampir seluruhnya emas murni.
- Tabel ringkas: kadar, perkiraan persentase emas murni.

## Emas 24K

- Ciri: paling murni, lunak, warna kuning pekat.
- Cocok untuk: simpanan.
- [ISI: bentuk 24K yang dijual toko]

## Emas 22K

- Ciri: sedikit campuran, lebih kuat dari 24K.
- Cocok untuk: perhiasan dan mas kawin.

## Emas 18K dan di bawahnya

- Ciri: lebih keras, lebih tahan dipakai sehari-hari, harga per gram lebih rendah.
- [ISI: kadar lain yang dijual toko, misalnya 17K dan 16K, dan kegunaannya]

## Mana yang nilai jual kembalinya lebih baik

- Jelaskan secara umum hubungan kadar dan harga beli kembali.
- [ISI: kebijakan beli kembali toko per kadar]
- Tautkan ke [Layanan](/layanan).

## Penutup (75–100 kata)

- Rangkum: pilih kadar sesuai tujuan.
- Ajakan: lihat [Katalog](/katalog) dan saring menurut kadar.
$md$
),
(
  'tips-membeli-mas-kawin',
  'Tips Membeli Mas Kawin Emas',
  'Tips memilih mas kawin emas: tentukan anggaran, pilih kadar dan berat, cek ukuran cincin, dan simpan surat emasnya.',
  'draft',
  $md$> DRAF KERANGKA. Lengkapi bagian bertanda [ISI: …] sebelum diterbitkan.

Kata kunci utama: mas kawin emas. Kata kunci pendukung: cincin kawin, emas pernikahan, tips membeli emas.

## Pembuka (100–150 kata)

- Situasi pembaca: persiapan nikah, banyak yang harus diputuskan, anggaran terbatas.
- Janji artikel: lima hal yang perlu diputuskan, berurutan.

## Tentukan anggaran dan berat lebih dulu

- Mulai dari anggaran, lalu lihat berat yang didapat dari harga hari ini.
- Tautkan ke [Kalkulator](/kalkulator).

## Pilih kadar

- Bandingkan singkat 24K, 22K, 18K untuk mas kawin.
- Tautkan ke artikel perbedaan kadar.

## Ukuran cincin dan model

- Cara mengukur jari; kapan sebaiknya mengukur.
- [ISI: apakah toko melayani ubah ukuran dan ukir nama, serta lamanya]

## Kapan sebaiknya membeli

- Beri waktu untuk pesanan khusus dan ukiran.
- [ISI: lama pengerjaan pesanan khusus di toko]

## Simpan surat emas

- Mengapa surat penting untuk jual kembali dan tukar tambah.
- Tautkan ke [Cara membaca surat emas](/kepercayaan#surat-emas).

## Penutup (75–100 kata)

- Rangkum lima keputusan.
- Ajakan: lihat koleksi [Mas Kawin](/katalog?jenis=mas-kawin) dan tanya via WhatsApp.
$md$
)
on conflict (slug) do nothing;
