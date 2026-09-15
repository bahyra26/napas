# NAPAS v2 — Rencana Bangun Program (Tanpa MedQueue)
## Radar Burnout Mahasiswa: Deteksi Dini → Skor → Intervensi → Refleksi

> Core loop sekarang: **3 sinyal (Ide 1+2+3) → Burnout Index → Intervensi on-device → Refleksi & Rekomendasi**
> Lapisan eskalasi tetap ada tapi **ringan**: "Wellness Playbook" (aksi mandiri + ajakan konsultasi BK/dokter bila berlanjut) — tanpa sistem antrean triase.

---

## 1. Bentuk Program: 3 Komponen

```
┌───────────────────────────── LAPTOP MAHASISWA ─────────────────────────────┐
│  ① NAPAS Agent (Python + PySide6) — berjalan di background                │
│  ┌──────────────┐  ┌───────────────────┐  ┌────────────────────────┐      │
│  │ S1 Workload  │  │ S2 BioVisual      │  │ S3 Focus Guard         │      │
│  │ Scanner      │  │ Sensor (webcam)   │  │ (active window)        │      │
│  │ ICS/CSV/task │  │ MediaPipe: blink, │  │ klasifikasi akademik/  │      │
│  │ + deadline   │  │ alis, rahang, dur │  │ distraksi              │      │
│  └──────┬───────┘  └────────┬──────────┘  └───────────┬────────────┘      │
│         └────────────────────┼─────────────────────────┘                   │
│                            metrik tiap 60 dtk                              │
│  ┌───────────────────────────▼───────────────────────────┐                 │
│  │  INTERVENSI ON-DEVICE (jika perlu)                    │                 │
│  │  • Guided breathing overlay (60 dtk, animasi 4-7-8)   │                 │
│  │  • Focus Lock Mode (overlay + ketik komitmen)         │                 │
│  │  • Microbreak nudge (aturan 20-20-20)                 │                 │
│  └───────────────────────────────────────────────────────┘                 │
│  UI lokal: tab "Hari Ini" (index + zona + alasan) & "Tren"                 │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ metrik agregat (bukan video)
                    ┌──────────▼──────────┐
                    │ ② BACKEND (FastAPI) │
                    │  Burnout Engine:    │
                    │  index 0–100, zona, │
                    │  tren 7 hari,       │
                    │  alasan explainable │
                    │  + insight mingguan │
                    │    (LLM, disclosed) │
                    └──────────┬──────────┘
                    ┌──────────▼──────────┐
                    │ ③ WEB DASHBOARD     │
                    │  (Next.js, siswa)   │
                    │  Home / Tren /      │
                    │  Deadline Radar /   │
                    │  Fokus / Laporan    │
                    └─────────────────────┘
```

**Kenapa 3 komponen (bukan 1 app saja)?**
- Agent = nilai utama & demo paling wow (webcam live di panggung).
- Backend = rumah data + engine; bikin cerita "platform" yang rapi dan mudah dikembangkan (multi-device, institusi) → poin Implementasi Teknis 30%.
- Web = "produk" yang terlihat dewasa di video/pitch, dan tetap bisa didemo walau laptop demo bermasalah (fallback).

**Keputusan desain penting:**
1. **Video webcam TIDAK pernah disimpan/kirim** — hanya angka (blink rate, tension score, durasi) tiap menit. Privasi by design = jawaban terbaik untuk juri.
2. **Semua skor explainable** — UI selalu menampilkan "mengapa" (chips alasan), bukan angka misterius. Juri FMIPA (ilmuwan) akan menghargai transparansi.
3. **Early warning = tren, bukan spike** — index naik 3 hari beruntun → flag "tren memburuk" + intervensi lebih agresif. Ini yang membedakan NAPAS dari sekadar app reminder.
4. **Opt-in penuh** — toggle per sensor di Settings; default semua OFF sampai pengguna consent.

---

## 2. Fitur per Komponen

### ① NAPAS Agent (desktop)
| Modul | Fitur MVP | Stretch (jika sempat) |
|---|---|---|
| **S1 Workload** | Import ICS + CSV, entri manual tugas (deadline, est. jam, effort), Load Score, deteksi agenda >22.00 | Google Calendar API live sync |
| **S2 BioVisual** | MediaPipe Face Mesh: blink rate, intensitas alis (brow furrow proxy), jarak rahang, durasi tatap layar tanpa jeda; interval 60 dtk; deteksi "wajah tidak terlihat" (tidak di depan laptop) | Kalibrasi awal per-user (baseline pribadi) |
| **S3 Focus** | Baca active window/tab title, klasifikasi akademik vs distraksi (kategori + user whitelist/blacklist), timer distraksi | Browser extension (tab-level, akurat) |
| **Intervensi** | (a) Guided breathing 60 dtk saat S2 melewati threshold; (b) Focus Lock saat distraksi >5 mnt; (c) nudge istirahat tiap 45–50 mnt fokus | Audio relaksasi, jadwal "golden hour" |
| **UI lokal** | Tab Hari Ini: gauge index, zona, chips alasan, tombol "saya merasa…" (check-in 2 tap); Tab Tren: mini-chart 14 hari | Notifikasi sistem, widget tray |

**Trigger intervensi (aturan sederhana & transparan):**
- Blink rate turun >30% dari baseline **atau** brow tension tinggi >10 mnt → tawarkan breathing.
- Distraksi >5 mnt → Focus Lock.
- Fokus >45 mnt tanpa jeda → nudge 20-20-20.
- Index ≥80 (merah) → "Wellness Playbook" muncul (lihat ③).

### ② Burnout Engine (backend)
```
Burnout Index (0–100) =
    0.35 × LoadScore(workload)        # beban & deadline
  + 0.35 × StressScore(biovisual 7 hr)
  + 0.20 × DistractionScore(fokus)
  + 0.10 × CheckInSubjektif (1–5)
  ± modifikator tren: +10 jika index 3 hari beruntun naik
Zona: 0–29 hijau | 30–59 kuning | 60–79 oranye | 80+ merah
```
- Simpan history harian → chart tren, heatmap per jam/hari.
- **Insight mingguan** via LLM (disclose penggunaan AI sesuai aturan lomba): ringkasan 3 kalimat + 3 saran konkret.

### ③ Web Dashboard (view siswa)
| Halaman | Isi |
|---|---|
| **Home** | Gauge Burnout Index hari ini, zona, chips alasan ("6 deadline dalam 7 hari", "kedipan turun 35%", "distraksi 42 mnt"), check-in 2 tap, tombol breathing |
| **Tren** | Line 30 hari + heatmap stres per jam & hari; penanda hari intervensi |
| **Deadline Radar** | Grid 14 hari, intensitas beban per hari, badge tugas |
| **Fokus** | Fokus vs distraksi harian, top-5 pencuri waktu, "focus streak" |
| **Laporan** | Insight mingguan LLM, statistik intervensi, **Wellness Playbook** (jika merah: 3 aksi bertahap → "jika berlanjut 7 hari, kami sarankan konsultasi ke BK kampus/dokter" + info lokasi) |
| **Settings** | Consent per sensor, threshold, whitelist aplikasi, data export |

---

## 3. Data Model (inti)

```
users(id, nama, email, consent_camera, consent_window, created_at)
workload_items(id, user_id, judul, jenis[tugas/rapat/kuliah], deadline, est_jam, effort[1-5], status)
sensor_metrics(id, user_id, ts, blink_rate, brow_tension, jaw_tension, gaze_minutes, face_visible, focus_seconds, distraction_seconds, app_category)
interventions(id, user_id, ts, tipe[breathing/lock/break/playbook], durasi, selesai)
check_ins(id, user_id, ts, skor[1-5], catatan)
daily_index(id, user_id, tanggal, index, zona, load_score, stress_score, dist_score, alasan_json, trend_flag)
```

API (FastAPI): `POST /metrics` (batch 1 mnt), `GET /index/today`, `GET /index/history`, `POST /workload`, `GET /insights/weekly`, WebSocket `/live` (untuk tampilan real-time di web saat demo).

---

## 4. Scope MVP vs Stretch (deadlines kaku: 16 Okt)

**MUST (jika salah satu gagal, project gagal):**
- S1: import ICS/CSV + entri manual + Load Score
- S2: blink rate + brow tension (interval 60 dtk, on-device)
- S3: active window + klasifikasi + Focus Lock
- Engine: index + zona + alasan + flag tren
- UI lokal: tab Hari Ini & Tren
- Web: Home + Tren + Deadline Radar
- Intervensi: breathing overlay + lock mode
- Deliverables: video 2 mnt, GitHub, pitch deck, prototype

**SHOULD:** web halaman Fokus + Laporan, insight LLM mingguan, heatmap.

**COULD (stretch):** Google Calendar API, browser extension, kalibrasi baseline per-user, PWA.

**TIDAK akan dikerjakan** (untuk disiplin scope): multi-user institusi, mobile app, ML model custom, integrasi BK/Puskesmas (sudah dicoret).

---

## 5. Urutan Bangun (mitigasi risiko: uji hal paling berisiko di minggu 1)

| Minggu | Fokus | Output |
|---|---|---|
| **W1: 1–7 Sep** | Setup repo + CI, skeleton 3 komponen. **SPIKE: MediaPipe blink detection** (risiko #1) & **parsing ICS** (risiko #2) | 2 spike tervalidasi atau plan-B (mis. CV sederhana contour) sudah dipilih |
| W2: 8–14 Sep | Agent sensor loop 60 dtk → simpan metrik; S1 selesai; skeleton FastAPI | Agent berjalan, data masuk DB |
| W3: 15–21 Sep | **(19 Sep: Technical Meeting — wajib)** Burnout Engine + zona + alasan; web Home & Tren | Index live di 2 tampilan |
| W4: 22–28 Sep | S3 + klasifikasi; Intervensi (breathing overlay, lock mode); web Deadline Radar | Loop deteksi→intervensi jalan |
| W5: 29 Sep–5 Okt | Integrasi end-to-end, check-in 2 tap, heatmap, insight LLM | Demo kasar 10 menit stabil |
| W6: 6–12 Okt | Polish UI, seed data demo, rehearsal 2× | Demo 2 menit siap direkam |
| W7: 13–15 Okt | Rekam video, pitch deck, proposal, README + arsitektur di GitHub | Semua deliverables final |
| **16 Okt 23.59** | **KUMPULKAN** | ✅ |
| 23 Okt | Pengumuman | → Grand Final 1 Nov (FMIPA UGM, luring) |

---

## 6. Pembagian Tugas (tim 4)

| Anggota | Scope |
|---|---|
| **P1 — Agent & CV** | S2 (MediaPipe), S3 (window + klasifikasi), overlay intervensi, UI PySide6 |
| **P2 — Backend & Engine** | FastAPI, Burnout Engine, S1 (ICS/CSV + Load Score), insight LLM, WebSocket, DB |
| **P3 — Web** | Next.js: Home, Tren, Radar, Fokus, Laporan, Settings; integrasi API |
| **P4 — UX & Impact** | Desain UI/UX (Figma → handoff), identitas visual, data pendukung (statistik burnout mahasiswa Indonesia), **pitch deck, video 2 mnt, proposal**, rehearsal |

Aturan tim: standup singkat 2× seminggu; definisi "selesai" per fitur; branch protection + PR review minimal 1.

---

## 7. Skenario Demo (video 2 menit & panggung final)

Karakter: **Raka**, mahasiswa tingkat akhir, deadline week.

1. **0:00–0:20 — Masalah.** Web Home: Deadline Radar merah (6 deadline/7 hari), Load Score 82. Narasi: "Raka pikir ia baik-baik saja… sampai napasnya bicara."
2. **0:20–0:50 — Deteksi (WOW MOMENT, live di laptop).** Raka coding; overlay kecil NAPAS: blink ↓35%, alis tegang 12 mnt → index naik kuning→oranye → **guided breathing 60 dtk muncul otomatis** (animasi napas 4-7-8).
3. **0:50–1:15 — Intervensi fokus.** Raka membuka tab game → 5 menit → **Focus Lock** penuh → ketik komitmen → kembali fokus. Statistik: +2 jam fokus hari itu.
4. **1:15–1:40 — Early warning.** Chart tren: 4 hari naik beruntun → flag oranye "tren memburuk". Check-in 2 tap: "capek & sulit tidur".
5. **1:40–2:00 — Refleksi.** Insight mingguan LLM muncul + Wellness Playbook: 3 aksi (cut-off layar 22.00, 30 mnt jalan kaki, curhat ke teman) + "jika gejala berlanjut 7 hari → konsultasi ke BK kampus" (info lokasi kampus). Closer: **"Deteksi dini yang tidak berhenti di peringatan — tapi sampai ke tindakan."** Logo NAPAS.

**Tip demo panggung:** siapkan **script simulasi** (CLI "demo mode" yang memaksakan kondisi oranye/merah dalam hitungan detik) agar live demo tidak bergantung pada akurasi webcam di ruangan — tapi tetap tampilkan 10–15 detik deteksi webcam sungguhan untuk kredibilitas.

---

## 8. Bank Jawaban Juri (tanpa MedQueue)

| Tanya | Jawab |
|---|---|
| "Deteksi wajah valid secara medis?" | Tidak diklaim. Ini sinyal perilaku (blink rate & tension proxy terdokumentasi di literatur); validasi berasal dari fusi 3 sinyal + check-in subjektif + tren, bukan satu sensor. |
| "Privasi?" | On-device, video tidak disimpan tidak dikirim (bisa ditunjukkan di kode), opt-in, export & hapus data penuh; sesuai UU PDP. |
| "Beda dengan app wellbeing/reminder biasa?" | Mereka berbasis pengingat waktu. NAPAS berbasis **status fisiologis & perilaku real-time** + explainable scoring + early warning tren. |
| "Kenapa mahasiswa pakai?" | Value hari pertama: breathing, focus report, deadline radar. Skala: adopsi via BEM/UKM/BK; kelayakan: ringan, tanpa hardware tambahan. |
| "Kalau kamera tidak akurat di lapangan?" | Desain toleran: metrik berbasis tren 60 dtk & baseline pribadi; sensor bisa dimatikan — index tetap jalan dari S1+S3+check-in (degradasi graceful, tunjukkan di demo). |
| "Business/implikasi?" | Model: gratis untuk siswa, paket institusi (univ/faskes kerja sama) untuk analytics agregat anonim. |

**Degradasi graceful** di atas adalah fitur desain yang disengaja: tiap sensor opsional, index selalu bisa dihitung — ini menjawab 80% pertanyaan teknis juri.

---

## 9. Checklist Admin (jangan lewat)

- [ ] Daftar di website JOINTS (sebelum **16 Sep**; early bird Rp50rb)
- [ ] Upload Bukti Post Twibbon, Bukti IG Story, Bukti Pembayaran
- [ ] **Technical Meeting 19 Sep** (syarat lolos — catat di kalender, 4 orang)
- [ ] Video YouTube **public** (bukan unlisted) maks 2 menit
- [ ] Repo GitHub: README, arsitektur, cara jalankan, disclose penggunaan AI
- [ ] Pitch deck PDF; proposal PDF maks 10 hal (disarankan)
- [ ] Tiket/perjalanan Yogyakarta untuk Grand Final 1 Nov (FMIPA UGM, 07.00–15.30 WIB)
