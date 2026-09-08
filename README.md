# Pustakadio — MVP Scaffold (Tahap 1: Fondasi)

## Yang sudah jadi
- Next.js project scaffold, siap deploy ke Vercel (Hobby, free)
- `sql/001_init.sql` — skema Supabase lengkap (topics, episodes, sources, saved_episodes,
  listening_history, downloads, search_queries), device_id-based (no login)
- `pages/api/episodes.js` — action-based: `list`, `get`, `search`, `daily` (1 function)
- `pages/api/user.js` — action-based: `save`, `unsave`, `saved-list`, `progress`, `history` (1 function)
- `pages/index.js` — Home, sudah nyambung ke API (masih styling minimal, belum pakai
  komponen dari mockup HTML yang udah di-lock)
- `lib/supabase.js` — fetch-based client, gak perlu SDK
- `lib/device.js` — device_id generator (localStorage)

Total 2 serverless functions dipakai dari limit 12 di Vercel Hobby — masih longgar
buat nambah `api/generate.js` (content pipeline) nanti.

## Setup
1. Bikin project Supabase baru (terpisah dari BapakAI/TOPSID, sesuai keputusan)
2. Jalankan `sql/001_init.sql` di SQL Editor Supabase
3. Bikin 2 Storage bucket (public read): `episodes-audio`, `episodes-covers`
4. Copy `.env.example` → `.env.local`, isi `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`
   (pakai service_role key, bukan anon key)
5. `npm install` lalu `npm run dev`

## Belum jadi (prioritas selanjutnya)
- [ ] Player page + komponen dari mockup yang udah di-lock (styling asli belum dipasang)
- [ ] Halaman Cari, Koleksiku
- [ ] Content pipeline (`api/generate.js` — script via Claude Haiku, TTS via Google Neural2)
- [ ] Belum ada episode published — database masih kosong, perlu isi manual atau jalanin
      pipeline dulu biar Home gak kosong

## Catatan desain
- Semua styling di `styles/globals.css` pakai token warna resmi dari brand kit
  (#0B2A4A, #2563EB, #EAF3FF, #F8F9FC) — belum di-restyle sesuai mockup HTML yang
  udah di-approve, itu kerjaan tahap berikutnya
