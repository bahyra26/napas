# NAPAS — Radar Burnout & Kesejahteraan Mahasiswa
> **Privacy-First Cognitive Workload & Stress Intervention Platform**  
> *Deteksi Dini → Skor Terjelaskan (Explainable) → Intervensi On-Device → Refleksi & Rekomendasi*

[![Deploy to GitHub Pages](https://github.com/bahyra26/napas/actions/workflows/deploy.yml/badge.svg)](https://github.com/bahyra26/napas/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-0a5445?style=flat&logo=googlechrome&logoColor=white)](https://bahyra26.github.io/napas/)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite-blue?style=flat)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌐 Live Demo
Aplikasi web ini telah dideploy secara otomatis menggunakan GitHub Actions:  
👉 **[https://bahyra26.github.io/napas/](https://bahyra26.github.io/napas/)**

---

## 💡 Latar Belakang & Visi Produk
Banyak mahasiswa menghadapi siklus *burnout* akibat akumulasi beban deadline kuliah, jam belajar tak teratur, dan distraksi digital tanpa menyadari penurunan kondisi fisik maupun mental mereka. 

**NAPAS** dirancang sebagai radar burnout preventif yang menggabungkan 3 sinyal utama:
1. **S1: Workload Scanner** — Pemindaian jadwal, beban tugas, dan kalender deadline.
2. **S2: BioVisual Sensor (On-Device)** — Deteksi pola kedipan mata, ketegangan alis/rahang secara lokal tanpa menyimpan atau mengirim video webcam (*Privacy by Design*).
3. **S3: Focus Guard** — Klasifikasi jendela aktif akademik vs distraksi digital.

Hasil integrasi sinyal ini diterjemahkan ke dalam **Burnout Index (0–100)** yang **transparan & terjelaskan (*Explainable AI*)**, dilengkapi intervensi on-device serta rencana aksi mandiri (**Wellness Playbook**).

---

## ✨ 6 Modul Utama Dashboard

### 1. 🏠 Home (Dashboard Harian & Profil)
* **Burnout Index Gauge**: Lingkaran persentase dinamis dengan label zona (*Hijau: Prima, Kuning: Sedang, Oranye/Merah: Tinggi*).
* **Explainable Card ("Kenapa skor ini?")**: Rincian indikator penjelas (jumlah deadline, durasi tidur, waktu distraksi, dan ritme kedipan mata) dengan accordion detail lanjutan.
* **Mood Check-In 2-Ketukan**: Check-in emosi subjektif instan (*Bahagia, Netral, Sedih*) dengan feedback badge dan notifikasi interaktif.
* **Latihan Pernapasan Terpandu (Breathing 4-7-8)**: Panduan ritme napas visual langsung di halaman beranda (*Tarik Napas 4s → Tahan 7s → Hembuskan 8s*).
* **Deadline Terdekat**: Manajemen daftar tugas cepat dengan modal interaktif untuk menambahkan tugas baru (*+ Tambah Tugas*).

### 2. 📈 Tren Kesejahteraan
* **Early Warning Line Chart 14 Hari**: Grafik fluktuasi skor dengan titik anotasi khusus (**Titik Intervensi**) dan banner peringatan tren memburuk jika indeks naik beruntun.
* **Heatmap Stres per Jam & Hari**: Matriks visual 8 jam (08:00 - 22:00) x 7 hari dengan indikasi warna beban (*Ringan, Sedang, Berat*) dan tooltip detail per sel.
* **Analisis & Pola Klinis Ringan**: Identifikasi waktu puncak stres dan pola hari terberat beserta rekomendasi jeda istirahat.

### 3. 🎯 Deadline Radar
* **Kalender Beban Kognitif 14 Hari**: Grid tanggal dinamis *real-time* yang terhitung otomatis dari hari ini.
* **Ringkasan Beban Terpadu**: Statistik otomatis untuk total tugas, jumlah hari zona berat, tanggal terpadat, dan hari bebas deadline.
* **Detail Agenda & Load Score**: Rincian tugas per hari dengan skor beban harian.
* **Rekomendasi Reschedule Pintar**: Modal interaktif untuk memindahkan agenda berat ke hari bebas beban guna meredakan stres.

### 4. ⏱️ Fokus & Distraksi
* **Overview Fokus Harian**: Donut chart proporsi waktu fokus vs waktu distraksi dengan pesan motivasi harian.
* **Top 5 Pencuri Waktu**: Visualisasi aplikasi pengurang fokus (YouTube, Instagram, Discord, game, media sosial) beserta durasi menitnya.
* **Focus Streak Gamifikasi**: Pelacakan konsistensi fokus harian (Senin s/d Minggu) dengan target >4 jam/hari dan pencatatan rekor terbaik.
* **Grafik Fokus vs Distraksi (7 Hari Terakhir)**: Stacked bar chart persentase waktu produktif harian.

### 5. 📑 Laporan & Rekomendasi
* **Insight Mingguan (AI/LLM-Based)**: Narasi empati yang meringkas evaluasi performa dan istirahat mingguan mahasiswa.
* **Wellness Playbook Berjenjang**: 3 langkah aksi mandiri konkret (pembatasan layar malam, jeda jalan kaki, dukungan sosial) dengan eskalasi bertanggung jawab ke Bimbingan Konseling (BK) kampus jika stres berlanjut.
* **Riwayat Intervensi**: Log aktivitas pemulihan terbaru (*Breathing*, *Focus Lock*, *Microbreak*).
* **Refleksi Harian**: Modal refleksi malam untuk mencatat hal baik yang ingin diulang esok hari.

### 6. ⚙️ Settings & Privasi
* **Komitmen Privasi Penuh (*Privacy by Design*)**: Banner jaminan pemrosesan sinyal lokal on-device.
* **Izin Sensor Mandiri (Opt-In)**: Pengguna memegang kendali penuh untuk menyalakan/mematikan Kamera BioVisual, Aktivitas Jendela, dan Check-in.
* **Personalisasi Intervensi**: Konfigurasi toggle latihan pernapasan, focus lock, microbreak, dan pengaturan batas toleransi distraksi.
* **Whitelist Aplikasi Fokus**: Manajemen aplikasi akademik (VS Code, Notion, Google Docs, dll.) yang tidak dihitung sebagai distraksi.
* **Manajemen Data**: Opsi ekspor data kesehatan mandiri dan kelola profil akun.

---

## 🕒 Sistem Waktu Dinamis (Real-Time Dynamic System)
Seluruh penanggalan pada aplikasi ini terintegrasi secara dinamis dengan waktu lokal pengguna:
* **Penanggalan Hari Ini**: Format standar Indonesia (`Sen, 5 Okt 2026`) yang otomatis berubah setiap hari.
* **Kalender 14 Hari & Grafik 7 Hari**: Rentang hari dihitung secara otomatis dari tanggal berjalan (`new Date()`).
* **Timestamp Terakhir Diperbarui**: Jam dan menit pada menu pengaturan merefleksikan waktu akses nyata.

---

## 🛠️ Arsitektur & Teknologi

* **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool & Dev Server**: [Vite](https://vitejs.dev/)
* **Styling**: Vanilla CSS (Responsive Flexbox & Grid, CSS Variables Design Tokens, Keyframe Animations)
* **Tipografi**: Poppins (Google Fonts)
* **Ikon**: Phosphor & Heroicons Vector SVG
* **CI/CD Deployment**: GitHub Actions (Build otomatis ke GitHub Pages)

---

## 📁 Struktur Direktori

```text
napas/
├── .github/workflows/
│   └── deploy.yml            # Workflow CI/CD otomatis ke GitHub Pages
├── dokumen/                  # Dokumentasi & aset mockup visual UI/UX
│   ├── home.jpeg
│   ├── tren.jpeg
│   ├── deadline.jpeg
│   ├── fokus.jpeg
│   ├── laporan.jpeg
│   └── settings.jpeg
├── public/
│   └── assets/               # Aset statis publik (logo, ikon vektor)
├── src/
│   ├── components/
│   │   ├── common/           # Toast, reusable components
│   │   ├── deadline/         # CalendarGrid, RingkasanBeban, AgendaDetail
│   │   ├── fokus/            # Overview, Streak, TopDistractors, BarChart
│   │   ├── home/             # GaugeCircle, KenapaCard, MoodCheckin, Breathing
│   │   ├── laporan/          # InsightMingguan, Playbook, Riwayat, Refleksi
│   │   ├── layout/           # Header, Sidebar, MobileBottomNav
│   │   ├── modals/           # AddTask, Reschedule, Threshold, AddApp, Profil
│   │   ├── settings/         # PrivacyBanner, SensorPermission, FocusApps
│   │   └── tren/             # TrendChart, HeatmapStres, Ringkasan, Kesimpulan
│   ├── data/                 # Initial mock data & demo datasets
│   ├── types/                # TypeScript interface definitions
│   ├── utils/                # dateUtils.ts (penanggalan real-time dinamis)
│   ├── App.tsx               # Root application component & routing state
│   └── main.tsx              # React DOM render entrypoint
├── index.html                # Entrypoint HTML
├── style.css                 # Global design system & layout styling
├── vite.config.ts            # Konfigurasi Vite & base path
└── package.json              # Dependency manifest & scripts
```

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
* [Node.js](https://nodejs.org/) versi 18 atau lebih baru
* npm (disertakan bersama Node.js)

### Langkah Instalasi
1. Clone repositori:
   ```bash
   git clone https://github.com/bahyra26/napas.git
   cd napas
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```

4. Buka di browser:  
   👉 **http://localhost:3000** (atau URL yang ditampilkan di terminal).

### Membangun Versi Produksi (*Build*)
Untuk memvalidasi atau membuat bundle statis:
```bash
npm run build
npm run preview
```

---

## 🔒 Privasi & Etika Penggunaan Sensor
NAPAS dirancang dengan prinsip **Ethics & Privacy by Design**:
* **On-Device Computing**: Komputasi kedipan mata dan ketegangan wajah diproses secara lokal di perangkat tanpa pernah menyimpan rekaman video ataupun mentransmisikannya ke internet.
* **Degradasi Anggun (*Graceful Degradation*)**: Setiap sensor bersifat opsional. Jika kamera dimatikan, Burnout Index tetap dapat dihitung dari sinyal beban tugas, jendela aktif, dan check-in mandiri.
* **Kepatuhan Perlindungan Data**: Sesuai dengan prinsip UU Perlindungan Data Pribadi (UU PDP).

---

## 👥 Tim Pengembang
Dikembangkan untuk **JOINTS (Jogja Information Technology Session)** — Universitas Gadjah Mada (UGM).
