# GREENSHIP NB 1.2 — Kalkulator Air WAC

Web app kalkulator air untuk sertifikasi GREENSHIP NB v1.2.
Mencakup: **WAC P2 · WAC 1 · WAC 2 · WAC 5 · WAC 6**

## Fitur
- **Wizard 6 langkah** — Data Bangunan → Fitur Air → Lansekap & CT → Air Hujan → Daur Ulang → Hasil
- **WAC 2 (NB 1.3):** ≥25%→1 poin, ≥50%→2 poin, ≥75%→3 poin
- **WAC 1 (NB 1.2):** Baseline dinamis (dihitung), 0–8 poin
- **Tipologi aktif:** Kantor (Office), Pabrik (Factory)
- **Import / Export** data proyek dalam format JSON
- **Real-time calculation** di setiap langkah

## Setup & Development

```bash
npm install
npm run dev
```

## Build untuk Produksi

```bash
npm run build
```
Output di folder `dist/` — siap deploy ke Netlify.

## Deploy ke Netlify

1. Push repo ke GitHub/GitLab
2. Connect di [app.netlify.com](https://app.netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Node version: 20

Atau drag-and-drop folder `dist/` langsung ke Netlify Dashboard.

`netlify.toml` sudah dikonfigurasi dengan security headers.

## Struktur Proyek

```
src/
├── types/          — TypeScript interfaces
├── constants/
│   ├── baselines.ts   — Nilai baseline fitur air (NB 1.2)
│   └── typologies.ts  — Konstanta perilaku per tipologi (7 tipologi)
├── engine/
│   └── calculations.ts — Engine kalkulasi (pure functions)
├── utils/
│   ├── sanitize.ts    — Sanitasi input (XSS, injection prevention)
│   ├── importExport.ts — Import/Export JSON dengan validasi penuh
│   └── defaults.ts    — State awal
└── components/
    ├── shared/        — Atom UI, FixtureSection
    └── App.tsx        — Wizard utama + semua steps
```

## Keamanan
- Client-side only — tidak ada backend, tidak ada data dikirim ke server
- Input sanitization mencegah XSS dan injection
- JSON import divalidasi secara ketat
- Security headers via `netlify.toml` (CSP, X-Frame-Options, dll.)

## Tipologi Mendatang (Phase 2)
Mall/Retail · Apartemen/Hotel · Airport · Masjid · Stadium
Konstanta semua tipologi sudah tersedia di `src/constants/typologies.ts`
