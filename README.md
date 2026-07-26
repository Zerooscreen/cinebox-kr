# 씨네박스 (CineBox) v2 — Server-Rendered, SEO per halaman

Versi ini berbeda dari versi pertama: sekarang situs dijalankan lewat **server
Node.js (Express)**, bukan file statis tunggal. Tujuannya supaya tiap film dan
series punya **URL asli sendiri** (`/movie/278/기생충`, bukan `#/movie/278`) dan
**judul + meta description yang sudah jadi** sebelum dikirim ke browser —
sehingga Google bisa mengindeks tiap halaman film/series secara terpisah.

## Kenapa harus server, bukan GitHub Pages lagi?

GitHub Pages hanya menyajikan file statis, tidak bisa menjalankan Node.js.
Karena versi ini butuh server untuk membuat URL asli + meta tag per halaman,
**pakai Railway** (yang sudah Anda siapkan), bukan GitHub Pages.

## Struktur file
```
server.js          → routing halaman & API proxy TMDB
lib/tmdb.js         → koneksi ke TMDB API (API key disembunyikan di server)
lib/render.js       → template HTML + tag SEO per halaman
public/style.css    → tampilan situs
public/app.js       → interaksi di browser (pencarian, buka season/episode)
package.json        → daftar dependency (Express)
railway.json        → konfigurasi deploy Railway
```

## Environment variable yang perlu diisi di Railway
Setelah deploy, buka **Settings → Variables** di project Railway, tambahkan:

| Key | Value |
|---|---|
| `TMDB_API_KEY` | API key TMDB Anda |
| `SITE_URL` | URL final situs Anda, contoh: `https://cinebox-kr.up.railway.app` |

Kalau tidak diisi, situs tetap jalan (pakai key bawaan & URL default di kode),
tapi tag SEO (canonical, Open Graph) tidak akan 100% akurat sampai `SITE_URL`
disesuaikan dengan domain asli Anda.

## Deploy ke Railway
1. Upload semua file di atas ke repo GitHub `cinebox-kr` (replace file lama).
2. Di railway.app → project yang sudah ada → **Settings → Variables** → isi
   `TMDB_API_KEY` dan `SITE_URL` seperti tabel di atas.
3. Railway otomatis re-deploy setelah ada perubahan file di GitHub.
4. Setelah selesai, cek beberapa halaman:
   - `/` atau `/movie` → beranda film
   - `/tv` → beranda series
   - `/movie/1061474/…` → contoh halaman detail film
   - `/sitemap.xml` → daftar URL untuk didaftarkan ke Google Search Console
   - `/robots.txt` → aturan crawler

## Langkah SEO lanjutan (opsional, di luar kode)
1. Daftarkan situs ke **Google Search Console**, submit `sitemap.xml`.
2. Pastikan `SITE_URL` di environment variable Railway sudah sesuai domain asli.
3. Kalau nanti pakai domain sendiri (bukan subdomain railway.app), update
   `SITE_URL` lagi supaya tag canonical & Open Graph ikut berubah.

## Catatan
Situs ini hanya menampilkan informasi (sinopsis, cast, trailer resmi YouTube)
dari TMDB — **bukan** layanan streaming, tidak menyediakan file/tautan nonton
film atau series apa pun.
