# NAPAS — Radar Burnout & Kesejahteraan Mahasiswa
> **Privacy-First Cognitive Workload & Stress Intervention Platform**  
> *Deteksi Dini → Skor Terjelaskan (Explainable) → Intervensi On-Device → Refleksi & Rekomendasi*

[![Deploy to GitHub Pages](https://github.com/bahyra26/napas/actions/workflows/deploy.yml/badge.svg)](https://github.com/bahyra26/napas/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-0a5445?style=flat&logo=googlechrome&logoColor=white)](https://bahyra26.github.io/napas/)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20TypeScript-blue?style=flat)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Dokumentasi Lengkap
* 👉 **[Panduan Lengkap Pengguna & Tata Cara Penggunaan (PANDUAN_PENGGUNA.md)](PANDUAN_PENGGUNA.md)** — Panduan langkah demi langkah penggunaan seluruh fitur untuk mahasiswa.

---

## 🌐 Live Demo
Aplikasi web ini telah dideploy secara otomatis:  
👉 **[https://bahyra26.github.io/napas/](https://bahyra26.github.io/napas/)**

---

## 💡 Latar Belakang & Visi Produk
Banyak mahasiswa menghadapi siklus *burnout* akibat akumulasi beban deadline kuliah, jam belajar tak teratur, dan distraksi digital tanpa menyadari penurunan kondisi fisik maupun mental mereka. 

**NAPAS** dirancang sebagai radar burnout preventif yang menggabungkan sinyal utama:
1. **S1: Workload Scanner** — Pemindaian jadwal, beban tugas, dan kalender deadline.
2. **S2: BioVisual Sensor (On-Device)** — Deteksi pola kedipan mata dan fokus secara lokal tanpa menyimpan atau mengirim video webcam (*Privacy by Design*).
3. **S3: Focus Guard** — Klasifikasi jendela aktif akademik vs distraksi digital.

Hasil integrasi sinyal ini diterjemahkan ke dalam **Burnout Index (0–100)** yang **transparan & terjelaskan (*Explainable AI*)**, dilengkapi intervensi relaksasi on-device serta rencana aksi mandiri (**Wellness Playbook**).

---

## ✨ Modul Utama Aplikasi

### 1. 🏠 Home (Dashboard Harian & Profil)
* **Burnout Index Gauge**: Lingkaran persentase dinamis dengan label zona (*Hijau: Prima, Kuning: Sedang, Oranye/Merah: Tinggi*).
* **Explainable Card ("Kenapa skor ini?")**: Rincian indikator penjelas (jumlah deadline, durasi tidur, waktu distraksi, dan ritme kedipan mata) dengan accordion detail lanjutan.
* **Mood Check-In 2-Ketukan**: Check-in emosi subjektif instan (*Bahagia, Netral, Sedih*) dengan feedback interaktif.
* **Latihan Pernapasan Terpandu (Breathing 4-7-8)**: Panduan ritme napas visual langsung di halaman beranda (*Tarik Napas 4s → Tahan 7s → Hembuskan 8s*).
* **Deadline Terdekat**: Manajemen daftar tugas cepat dengan modal interaktif untuk menambahkan tugas baru (*+ Tambah Tugas*).

### 2. 📈 Tren Kesejahteraan
* **Early Warning Line Chart 14 Hari**: Grafik fluktuasi skor dengan titik anotasi khusus (**Titik Intervensi**) dan banner peringatan tren memburuk jika indeks naik beruntun.
* **Heatmap Stres per Jam & Hari**: Matriks visual 8 jam (08:00 - 22:00) x 7 hari dengan indikasi warna beban (*Ringan, Sedang, Berat*) dan tooltip detail per sel.
* **Jurnal & Refleksi Harian**: Ruang pencatatan refleksi malam yang tersimpan aman untuk mengevaluasi hari Anda.

### 3. 🎯 Deadline Radar
* **Kalender Beban Kognitif 14 Hari**: Grid tanggal dinamis *real-time* yang terhitung otomatis dari hari ini.
* **Ringkasan Beban Terpadu**: Statistik otomatis untuk total tugas, jumlah hari zona berat, tanggal terpadat, dan hari bebas deadline.
* **Integrasi Google Calendar**:
  - *⚡ Sinkronisasi Cepat*: Memuat agenda perkuliahan semester secara instan.
  - *🔗 Akun Google*: Menghubungkan Google Calendar resmi untuk sinkronisasi otomatis.
  - *📋 Impor File (.ics)*: Mengunggah berkas kalender standar iCal.
* **Rekomendasi Reschedule Pintar**: Modal interaktif untuk memindahkan agenda berat ke hari bebas beban guna meredakan stres.

### 4. ⏱️ Sesi Fokus (Focus Guard)
* **Pomodoro Focus Timer**: Sesi belajar terstruktur dengan penghitung waktu mundur dan jeda istirahat.
* **Whitelist Website Akademik**: Akses cepat ke situs perkuliahan yang diizinkan (Google Scholar, GitHub, Notion, dll.).
* **Focus Streak Gamifikasi**: Pelacakan konsistensi fokus harian (Senin s/d Minggu) dengan target >4 jam/hari dan pencatatan rekor terbaik.

### 5. 📑 Laporan & Rekomendasi
* **Insight Mingguan (AI/LLM-Based)**: Narasi empati yang meringkas evaluasi performa dan istirahat mingguan mahasiswa.
* **Wellness Playbook Berjenjang**: 3 langkah aksi mandiri konkret (pembatasan layar malam, jeda jalan kaki, dukungan sosial) dengan eskalasi bertanggung jawab ke Bimbingan Konseling (BK) kampus jika stres berlanjut.

### 6. ⚙️ Settings, Profil & Privasi
* **Profil Mahasiswa**: Pengaturan identitas, program studi, semester, preferensi ritme tidur/kronotipe, dan upload foto profil.
* **Komitmen Privasi Penuh (*Privacy by Design*)**: Jaminan pemrosesan sinyal lokal on-device tanpa rekaman visual.
* **Izin Sensor Mandiri (Opt-In)**: Pengguna memegang kendali penuh untuk menyalakan/mematikan Kamera BioVisual, Aktivitas Jendela, dan Check-in.
* **Kedaulatan Data**: Ekspor rekap lengkap (JSON), ekspor tren harian (CSV), serta pembersihan cache dan reset preferensi akun.

---

## 🛠️ Arsitektur & Teknologi

* **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool & Dev Server**: [Vite](https://vitejs.dev/)
* **Backend API**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Penyimpanan Data**: SQLite Local-First & Supabase Cloud Sync
* **Styling**: Vanilla CSS (Responsive Flexbox & Grid, CSS Variables Design Tokens, Keyframe Animations)
* **Tipografi**: Poppins & Inter (Google Fonts)
* **Desktop Agent**: Python background companion untuk pelacakan jendela aktif

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
* [Node.js](https://nodejs.org/) versi 18 atau lebih baru
* [Python](https://www.python.org/) versi 3.10 atau lebih baru

### 1. Menjalankan Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*(Atau klik dua kali file `backend/run_backend.bat` di Windows)*.

### 2. Menjalankan Frontend (React + Vite)
```bash
npm install
npm run dev
```
Akses di browser Anda: 👉 **`http://localhost:3000`**

### 3. Menjalankan Agen Pendamping Desktop (Opsional)
```bash
cd agent
python napas_agent.py
```
*(Atau klik dua kali file `agent/run_agent.bat`)*.

---

## 🔒 Privasi & Etika Penggunaan Sensor
NAPAS dirancang dengan prinsip **Ethics & Privacy by Design**:
* **On-Device Computing**: Komputasi kedipan mata dan ketegangan wajah diproses secara lokal di perangkat tanpa pernah menyimpan rekaman video ataupun mentransmisikannya ke internet.
* **Degradasi Anggun (*Graceful Degradation*)**: Setiap sensor bersifat opsional. Jika kamera dimatikan, Burnout Index tetap dapat dihitung dari sinyal beban tugas, jendela aktif, dan check-in mandiri.
* **Kepatuhan Perlindungan Data**: Sesuai dengan prinsip UU Perlindungan Data Pribadi (UU PDP).

---

*NAPAS — Bernapas Lebih Tenang, Belajar Lebih Seimbang.* 🌿
