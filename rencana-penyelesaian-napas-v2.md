# Rencana Penyelesaian NAPAS v2 — Menyamakan Repo dengan Rancangan Awal

> Disusun setelah meninjau isi repo `bahyra26/napas` (branch `main`). Kabar baiknya: backend **jauh lebih lengkap** dari dugaan "kurang backend doang" — yang sebenarnya masih bolong adalah **sambungan antara frontend dan backend**.

---

## 1. Ringkasan Temuan

Repo ini sebenarnya sudah punya 2 bagian yang **masing-masing sudah cukup matang secara terpisah**, tapi **belum saling terhubung**:

- **Frontend** (React + TypeScript + Vite, 6 modul lengkap) → sudah live di GitHub Pages, tapi **100% jalan dari data dummy** (`src/data/mockData.ts`).
- **Backend** (FastAPI + Supabase, folder `backend/`) → endpoint, schema database, dan Burnout Engine-nya **sudah sangat lengkap**, bahkan lebih matang dari rancangan awal (ada graceful degradation, proteksi anti-salah-zona, endpoint simulasi panggung).

Jadi pekerjaan terbesar yang tersisa **bukan "membangun backend dari nol"**, melainkan **mengintegrasikan** dua bagian yang sudah ada ini, plus menambal beberapa endpoint yang dibutuhkan frontend tapi belum ada di backend.

---

## 2. Yang Sudah Sesuai Rancangan Awal ✅

| Area | Status |
|---|---|
| Skema database 6 tabel (`users`, `workload_items`, `sensor_metrics`, `interventions`, `check_ins`, `daily_index`) | Lengkap di `backend/schema.sql`, sudah pakai Supabase + indexing |
| Burnout Engine (bobot 0.35/0.35/0.20/0.10, zona hijau→merah, modifikator tren) | Lengkap di `backend/engine.py`, bahkan ditambah re-weighting otomatis saat sensor mati & proteksi "tidak boleh merah kalau sinyal aktif <2" |
| Endpoint inti | `/health`, `/users`, `/workload` (+ update status), `/metrics` (batch ingest), `/check-ins`, `/interventions` (+ statistik), `/index/today`, `/index/history` — semua sudah ada |
| "CLI demo mode" dari skenario pitching di plan awal | Sudah terpenuhi lewat `POST /demo/simulate` (bisa paksa kondisi oranye/merah dalam hitungan detik untuk rekaman video) |
| 6 modul UI Web Dashboard (Home, Tren, Deadline Radar, Fokus, Laporan, Settings) | Sudah dibangun lengkap, responsif, dan live di `bahyra26.github.io/napas` |
| CI/CD frontend | GitHub Actions sudah otomatis build & deploy ke GitHub Pages tiap push ke `main` |

---

## 3. Gap yang Harus Dikerjakan — Urutan Prioritas

### 🔴 Gap 1 (PALING KRITIS): Frontend belum terhubung ke backend sama sekali

6 file masih import langsung dari data dummy, bukan dari API:
```
src/App.tsx
src/components/settings/SettingsView.tsx
src/components/fokus/FokusView.tsx
src/components/laporan/LaporanView.tsx
src/components/tren/TrendChart.tsx
src/components/tren/HeatmapStres.tsx
```
Semua angka yang tampil di web sekarang (index, tren 14 hari, heatmap, dst) adalah **angka karangan**, bukan dari Supabase.

### 🔴 Gap 2: `src/services/api.ts` ada, tapi salah kontrak dan tidak dipakai

File ini sudah ditulis sebelumnya, tapi:
- **Tidak di-import di mana pun** (`grep` tidak menemukan satu pun file yang memakainya) — jadi sia-sia, nol efek.
- **Endpoint yang dipanggil salah**, tidak cocok dengan backend yang sebenarnya:

| Dipanggil di `api.ts` | Endpoint asli di backend |
|---|---|
| `GET /today/{userId}` | `GET /index/today?user_id=...` |
| `POST /checkin` | `POST /check-ins` |
| `POST /intervention` | `POST /interventions` |

- **Bentuk response juga beda** — `api.ts` mengharapkan field seperti `burnout_index`, `label_zona`, `alasan_chips`, `subskor.workload/sensor/self_report`, `confidence` — padahal backend sebenarnya mengembalikan `index`, `zona`, `alasan`, `load_score`, `stress_score`, `dist_score`, `checkin_score`, `sensors_missing`.

→ File ini perlu **ditulis ulang total**, bukan diperbaiki sebagian.

### 🟠 Gap 3: Tidak ada konsep "user" di frontend

Tidak ada pemanggilan `POST /users`, tidak ada penyimpanan `user_id` (misalnya di `localStorage`). Semua tampilan hardcode "Profil Raka" tanpa akun sungguhan. Backend butuh `user_id` di hampir semua endpoint, jadi frontend minimal perlu:
- Satu kali buat/ambil user (bisa demo user tunggal dulu untuk hackathon, tidak perlu sistem login penuh)
- Simpan `user_id`-nya supaya dipakai ulang di semua pemanggilan API

### 🟠 Gap 4: Beberapa tampilan frontend butuh data yang backend belum sediakan

| Fitur di UI | Endpoint yang dibutuhkan | Status |
|---|---|---|
| Gauge index & chips alasan (Home) | `GET /index/today` | ✅ Sudah ada |
| Tren 14 hari (Tren) | `GET /index/history` | ✅ Sudah ada |
| Heatmap stres per jam & hari (Tren) | Agregasi `sensor_metrics` per jam | ❌ Belum ada endpoint khusus — perlu ditambah, atau diagregasi di frontend dari data metrics mentah |
| Top 5 pencuri waktu, focus streak (Fokus) | Agregasi `sensor_metrics.app_category` & `distraction_seconds` | ❌ Belum ada endpoint ringkasan — backend baru simpan data mentah, belum ada logika agregasinya |
| Insight mingguan LLM (Laporan) | `GET /insights/weekly` | ❌ Belum dibuat (memang SHOULD, bukan MUST, di rancangan awal) |
| Toggle consent kamera/window (Settings) | `PATCH /users/{id}` | ❌ Belum ada — `users.py` baru punya `POST` (buat) & `GET` (baca), belum ada endpoint update |

### 🟡 Gap 5: Backend belum di-deploy ke mana pun

`deploy.yml` di GitHub Actions **hanya** build & deploy frontend (statis) ke GitHub Pages. Backend FastAPI masih cuma bisa jalan di `localhost`. Karena GitHub Pages tidak bisa menjalankan server Python, backend perlu di-host terpisah (misalnya Render, Railway, atau Fly.io — semuanya punya free tier yang cukup untuk kebutuhan demo hackathon), lalu URL-nya dipasang sebagai `VITE_API_URL` saat build frontend (lewat GitHub Actions secret/env, bukan di-hardcode `localhost`).

### 🟡 Gap 6: Row Level Security (RLS) Supabase belum diaktifkan

Sudah disebut sebagai catatan "to-do sebelum demo final" di panduan backend sebelumnya — masih relevan. Untuk development sekarang boleh dibiarkan dulu, tapi sebelum submit/demo final harus diaktifkan supaya data antar pengguna tidak bisa saling diakses.

### ⚪ Gap 7 (opsional/stretch — boleh ditunda): WebSocket `/live`

Sesuai rancangan awal, ini stretch goal untuk tampilan real-time di panggung, bukan wajib MVP. Kerjakan paling akhir kalau waktu masih cukup.

---

## 4. Urutan Pengerjaan yang Disarankan

1. **Tulis ulang `src/services/api.ts`** — sesuaikan path & bentuk response dengan endpoint backend yang sebenarnya (lihat tabel Gap 2).
2. **Tambahkan alur "user" minimal** — saat app pertama kali dibuka, panggil `POST /users` (atau cek `localStorage` dulu), simpan `user_id`.
3. **Sambungkan Home (`App.tsx` + `GaugeCircle`/`KenapaCard`)** ke `GET /index/today` — ini yang paling terlihat dampaknya (gauge index & chips alasan jadi data asli).
4. **Sambungkan `MoodCheckin` & `BreathingSection`** ke `POST /check-ins` dan `POST /interventions` — supaya aksi pengguna beneran tersimpan ke database.
5. **Sambungkan `QuickTasks`/`AddTaskModal`** ke `POST /workload` & `GET /workload/{user_id}`.
6. **Sambungkan `TrendChart`** ke `GET /index/history` (ini paling langsung, datanya sudah pas).
7. **Tambah endpoint baru di backend** untuk heatmap stres & ringkasan fokus (Gap 4), baru sambungkan `HeatmapStres` & `FokusView`.
8. **`SettingsView`**: tambah `PATCH /users/{id}` di backend untuk update consent, baru sambungkan toggle-nya.
9. **`LaporanView`**: sambungkan riwayat intervensi ke `GET /interventions` (sudah ada); insight mingguan LLM bisa menyusul belakangan (stretch).
10. **Deploy backend** (Render/Railway/Fly.io), set `VITE_API_URL` di GitHub Actions, redeploy frontend.
11. **Aktifkan RLS** di Supabase + buat policy dasar.
12. Terakhir (kalau waktu cukup): WebSocket `/live`.

---

## 5. Checklist "Sesuai Rancangan Awal"

- [x] `api.ts` ditulis ulang, cocok dengan endpoint & response backend asli (`getTodayIndex`, `getIndexHistory`, `getWorkloads`, `createWorkload`, `updateWorkloadStatus`, `deleteWorkload`, `postCheckIn`, `postIntervention`, `getInterventions`, `getHeatmap`, `getFocusSummary`, `getWeeklyInsight`, `simulateDemo`)
- [x] Ada alur pembuatan/penyimpanan `user_id` di frontend (auto-detect user demo Raka `951459f9-e92f-4193-b470-ea87a899e18d` & simpan di `localStorage`)
- [x] Home menampilkan index & alasan dari data Supabase asli (teruji: skor ~73% Oranye dengan 10 chips alasan dinamis)
- [x] Check-in & breathing/intervention tersimpan ke database saat dipakai (`POST /check-ins` & `POST /interventions`)
- [x] Tambah tugas (workload) tersimpan & muncul kembali setelah refresh (`POST /workload` & `DELETE /workload/{id}`)
- [x] Tren 14 hari menampilkan `daily_index` asli dari Supabase (`GET /index/history`)
- [x] Heatmap stres & ringkasan fokus punya sumber data asli dari backend (`GET /metrics/heatmap` & `GET /metrics/focus-summary`)
- [x] Toggle consent di Settings benar-benar mengubah data di Supabase (`PATCH /users/{user_id}`)
- [x] `insights/weekly` dibuat di backend (`backend/routers/insights.py`) dan tersambung ke `LaporanView`
- [x] RLS script disiapkan di `backend/rls.sql` untuk keamanan satu pintu
- [ ] Backend ter-deploy di hosting publik (Render / Railway / Fly.io / HuggingFace Spaces)
- [ ] Frontend production build memakai `VITE_API_URL` yang mengarah ke backend publik tsb
- [ ] (Opsional) WebSocket `/live` — kerjakan kalau waktu masih cukup sebelum 16 Oktober
