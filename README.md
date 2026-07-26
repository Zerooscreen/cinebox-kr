# 씨네박스 (CineBox) — Database Film & Series Korea

Situs database film & series (bukan streaming) dengan tampilan berbahasa Korea.
Menggunakan data resmi dari **TMDB (The Movie Database)** API — sinopsis/bio, cast,
trailer YouTube resmi, serta daftar season & episode yang bisa diklik.

## Fitur
- Tab **영화 (Film)** dan **시리즈 (Series)**
- Grid film/series populer, trending, top rated, akan tayang
- Klik poster → halaman detail: sinopsis lengkap, rating, genre, cast, trailer
- Untuk series: daftar season (klik untuk expand) → daftar episode (judul, tanggal
  tayang, rating, sinopsis tiap episode)
- Pencarian judul (multi search film + series)
- Semua teks UI dalam bahasa Korea, data diambil dengan `language=ko-KR`

## Cara pakai (lokal)
1. Buka `index.html` langsung di browser.
2. Saat pertama kali dibuka, akan diminta memasukkan **TMDB API Key** (v3 auth).
   Key disimpan di `localStorage` browser Anda sendiri, tidak dikirim ke server manapun.
3. Dapatkan API key gratis di: https://www.themoviedb.org/settings/api

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub, misalnya `cinebox-kr`.
2. Upload file `index.html` (dan `README.md`) ke repo tersebut.
   - Lewat web: klik **Add file → Upload files** di halaman repo, lalu drag file ini.
   - Atau lewat terminal:
     ```
     git init
     git add index.html README.md
     git commit -m "Initial commit: CineBox KR movie database"
     git branch -M main
     git remote add origin https://github.com/USERNAME/cinebox-kr.git
     git push -u origin main
     ```
3. Di repo, buka **Settings → Pages**.
4. Di bagian **Build and deployment**, pilih source: **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Klik **Save**.
5. Tunggu 1–2 menit, situs akan aktif di:
   `https://USERNAME.github.io/cinebox-kr/`

## Catatan keamanan
API key TMDB dimasukkan sendiri oleh pengunjung situs saat pertama kali buka
(disimpan di browser mereka via `localStorage`), **bukan** ditulis langsung di
kode. Jadi aman untuk repo publik. Kalau Anda ingin key otomatis terisi tanpa
diminta setiap pengunjung, Anda bisa hardcode di `index.html` pada baris
`let API_KEY = ...`, tapi ingat: itu akan terlihat publik jika repo-nya publik.

## Sumber data
Powered by [TMDB](https://www.themoviedb.org/) — situs ini hanya menampilkan
informasi (sinopsis, cast, trailer resmi YouTube), **tidak menyediakan** file
atau tautan streaming film/series apa pun.
