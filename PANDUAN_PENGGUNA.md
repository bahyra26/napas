# 📘 Panduan Pengguna & Dokumentasi Sistem NAPAS
> **Platform Asisten Kesejahteraan Mental & Manajemen Beban Kognitif Mahasiswa Berbasis Privasi**

---

## 📌 Daftar Isi
1. [Tentang NAPAS](#-tentang-napas)
2. [Prinsip Utama: Privasi & Kedaulatan Data](#-prinsip-utama-privasi--kedaulatan-data)
3. [Arsitektur & Komponen Program](#-arsitektur--komponen-program)
4. [Cara Menjalankan Program Secara Lokal](#-cara-menjalankan-program-secara-lokal)
   - [Langkah 1: Menjalankan Server Backend (FastAPI)](#langkah-1-menjalankan-server-backend-fastapi)
   - [Langkah 2: Menjalankan Antarmuka Web Frontend (React + Vite)](#langkah-2-menjalankan-antarmuka-web-frontend-react--vite)
   - [Langkah 3: Menjalankan Agen Pendamping Desktop (Opsional)](#langkah-3-menjalankan-agen-pendamping-desktop-opsional)
5. [Panduan Penggunaan Fitur (Modul demi Modul)](#-panduan-penggunaan-fitur-modul-demi-modul)
   - [1. Registrasi, Login & Onboarding Ritme Belajar](#1-registrasi-login--onboarding-ritme-belajar)
   - [2. Halaman Beranda (Home Dashboard)](#2-halaman-beranda-home-dashboard)
   - [3. Tren Kesejahteraan & Jurnal Harian](#3-tren-kesejahteraan--jurnal-harian)
   - [4. Deadline Radar & Kalender Beban Kognitif](#4-deadline-radar--kalender-beban-kognitif)
   - [5. Sesi Fokus & Focus Guard](#5-sesi-fokus--focus-guard)
   - [6. Laporan Mingguan & Wellness Playbook](#6-laporan-mingguan--wellness-playbook)
   - [7. Profil, Pengaturan & Manajemen Data](#7-profil-pengaturan--manajemen-data)
6. [Tanya Jawab & Pemecahan Masalah (FAQ)](#-tanya-jawab--pemecahan-masalah-faq)

---

## 💡 Tentang NAPAS

**NAPAS** (*Neuro-Adaptive Pace & Academic Shield*) adalah platform asisten mahasiswa yang dirancang untuk mencegah kejenuhan akademik (*burnout*) melalui pendekatan **deteksi dini preventif**, **transparansi analitik (*Explainable AI*)**, dan **intervensi kesejahteraan mandiri**.

Banyak mahasiswa mengalami penurunan produktivitas dan stres berat karena beban deadline tugas yang menumpuk secara tiba-tiba tanpa disadari. NAPAS membantu mahasiswa:
* Mengetahui tingkat kelelahan mental secara objektif melalui **Skor Burnout Index (0–100)**.
* Memahami alasan di balik skor tersebut (*Explainable Factors*).
* Menyelaraskan jadwal kuliah dan tugas secara seimbang dengan **Deadline Radar**.
* Mempertahankan konsentrasi belajar tanpa distraksi melalui **Sesi Fokus Terpandu**.
* Melakukan pemulihan pernapasan dan refleksi mental harian.

---

## 🛡️ Prinsip Utama: Privasi & Kedaulatan Data

NAPAS dibangun dengan filosofi **Privacy by Design**:
1. **Pemrosesan Lokal di Perangkat**: Analisis indikator fokus visual diproses seketika di perangkat Anda. **Tidak ada foto atau rekaman video yang pernah disimpan, direkam, atau dikirim ke internet.**
2. **Kedaulatan Data Penuh**: Anda memegang kendali penuh atas data Anda. Setiap saat Anda dapat mengekspor rekap riwayat (JSON/CSV) atau membersihkan sesi dan preferensi akun.
3. **Sensor Opsional (Opt-In)**: Setiap sensor (kamera, pelacak jendela aktif, pengingat check-in) dapat diaktifkan atau dinonaktifkan kapan saja melalui menu Pengaturan.

---

## 🏗️ Arsitektur & Komponen Program

Sistem NAPAS terdiri atas 3 komponen yang saling terintegrasi:

| Komponen | Teknologi | Peran & Fungsi | Port Default |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | React 18, TypeScript, Vite, CSS Tokens | Antarmuka interaktif responsif (Desktop, Tablet, Mobile, PWA) | `http://localhost:3000` |
| **Backend API** | FastAPI, Python 3.10+, SQLite Local-First, Supabase | Mesin kalkulasi Burnout Index, autentikasi, dan penyimpanan data | `http://localhost:8000` |
| **Desktop Companion Agent** | Python (PyQt / Win32 / psutil) | Agen latar belakang pendeteksi jendela belajar vs distraksi digital | Komunikasi via REST / WebSocket |

---

## 🚀 Cara Menjalankan Program Secara Lokal

### Prasyarat
Sebelum memulai, pastikan perangkat Anda telah terpasang:
* [Node.js](https://nodejs.org/) (versi 18 ke atas)
* [Python](https://www.python.org/) (versi 3.10 atau lebih baru)
* Peramban modern (Google Chrome, Microsoft Edge, atau Mozilla Firefox)

---

### Langkah 1: Menjalankan Server Backend (FastAPI)

1. Buka terminal atau Command Prompt di folder proyek `napas/backend`:
   ```bash
   cd backend
   ```
2. *(Opsional jika pertama kali)* Pasang dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan server backend:
   * **Cara Cepat (Windows):** Klik dua kali file `backend/run_backend.bat`.
   * **Atau via Terminal:**
     ```bash
     python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
     ```
4. Server backend aktif di: **`http://localhost:8000`**  
   *(Dokumentasi API interaktif dapat diakses di `http://localhost:8000/docs`).*

---

### Langkah 2: Menjalankan Antarmuka Web Frontend (React + Vite)

1. Buka jendela terminal baru di folder utama proyek `napas`:
   ```bash
   cd "c:\PROJECT MIKAIL V2\napas"
   ```
2. Pasang dependensi Node.js (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka peramban Anda dan kunjungi:  
   👉 **`http://localhost:3000`**

---

### Langkah 3: Menjalankan Agen Pendamping Desktop (Opsional)

Jika Anda ingin mengaktifkan pemantauan otomatis aplikasi aktif (misal mendeteksi waktu belajar di VS Code, browser, atau aplikasi tugas):
1. Buka folder `napas/agent`.
2. Klik dua kali file `run_agent.bat` atau jalankan via terminal:
   ```bash
   python agent/napas_agent.py
   ```
3. Agen akan berjalan di tray dan mengirimkan status fokus ke backend secara real-time.

---

## 📱 Panduan Penggunaan Fitur (Modul demi Modul)

### 1. Registrasi, Login & Onboarding Ritme Belajar
* **Masuk / Daftar Akun**: Masukkan username, nama lengkap, dan kata sandi pada halaman login.
* **Kuesioner Onboarding**: Pada saat pertama kali masuk, Anda dapat mengisi:
  - Kronotipe belajar (*Morning Person / Night Owl / Fleksibel*).
  - Target durasi tidur harian (misal: 7 jam).
  - Matakuliah dan jadwal perkuliahan semester aktif.
* **Foto Profil**: Anda dapat mengunggah atau mengganti foto profil langsung dari menu Profil/Pengaturan. Gambar akan otomatis dioptimasi dan disimpan dengan aman.

---

### 2. Halaman Beranda (Home Dashboard)
Dashboard harian memberikan ringkasan kondisi kebugaran kognitif Anda secara instan:
* **Burnout Index Gauge (0–100)**:
  - 🟢 **0–35 (Zona Prima)**: Kondisi kognitif segar dan optimal untuk materi perkuliahan berat.
  - 🟡 **36–70 (Zona Waspada)**: Beban tugas mulai meningkat, disarankan mengambil jeda istirahat berkala.
  - 🔴 **71–100 (Zona Kelelahan / Overload)**: Risiko kejenuhan tinggi; disarankan melakukan intervensi pernapasan dan penataan ulang deadline.
* **Kartu "Kenapa Skor Ini?" (Explainable Indicator)**:
  - Memberikan rincian 4 faktor penentu: durasi tidur, jumlah deadline dalam 3 hari ke depan, waktu distraksi, dan ritme kedipan/fokus.
* **Mood Check-in 2-Ketukan**:
  - Rekam suasana hati Anda (*Bahagia, Netral, Sedih/Lelah*) dengan sekali klik untuk memperkaya analisis kesejahteraan.
* **Latihan Pernapasan Terpandu (Breathing 4-7-8)**:
  - Panduan animasi visual relaksasi: Tarik napas 4 detik $\rightarrow$ Tahan 7 detik $\rightarrow$ Hembuskan 8 detik.
* **Deadline Terdekat**:
  - Daftar ringkas tugas kuliah yang akan segera jatuh tempo, lengkap dengan tombol untuk menandai selesai.

---

### 3. Tren Kesejahteraan & Jurnal Harian
Akses melalui menu **Tren & Laporan**:
* **Early Warning Line Chart (14 Hari)**:
  - Grafik tren naik-turunnya skor kelelahan mental mahasiswa selama dua pekan terakhir.
  - Dilengkapi titik intervensi pemulihan saat Anda menyelesaikan sesi relaksasi.
* **Heatmap Stres per Jam & Hari**:
  - Matriks visual 7 hari $\times$ jam belajar (08:00 – 22:00) yang memetakan jam-jam paling padat dan melelahkan.
* **Jurnal & Refleksi Harian**:
  - Ruang catatan untuk menuliskan refleksi apa yang dipelajari dan disyukuri hari ini. Catatan tersimpan secara privat di jurnal akun Anda.

---

### 4. Deadline Radar & Kalender Beban Kognitif
Akses melalui menu **Deadline**:
* **Kalender Beban Kognitif 14 Hari**:
  - Tampilan grid kalender dinamis yang terhitung otomatis dari tanggal hari ini.
  - Setiap tanggal memiliki kode warna beban tugas (*Hijau: Bebas Tugas, Kuning: Ringan, Merah: Padat*).
* **Integrasi Kalender (Google Calendar)**:
  - Klik kartu **Integrasi Google Calendar** di bagian atas untuk membuka opsi sinkronisasi:
    1. **⚡ Sinkronisasi Cepat**: Memuat agenda jadwal perkuliahan, praktikum, dan ujian semester secara otomatis ke kalender NAPAS Anda.
    2. **🔗 Akun Google**: Menghubungkan langsung akun Google Calendar Anda.
    3. **📋 Impor File / Link (.ics)**: Mengunggah file kalender `.ics` atau menempelkan URL kalender eksternal.
* **Penjadwalan Ulang Pintar (Smart Reschedule)**:
  - Jika satu hari memiliki terlalu banyak beban, sistem akan merekomendasikan tanggal terdekat yang bebas tugas untuk memindahkan sebagian beban kerja.

---

### 5. Sesi Fokus & Focus Guard
Akses melalui menu **Fokus**:
* **Timer Fokus Pomodoro**:
  - Mulai sesi belajar terstruktur (misal: 25 menit fokus, 5 menit jeda istirahat).
* **Whitelist Website Akademik**:
  - Kelola daftar website yang diizinkan selama sesi belajar (misal: Google Scholar, GitHub, Notion, E-Learning Kampus).
  - Terdapat tombol pembuka cepat untuk langsung menuju situs akademik tanpa distraksi.
* **Focus Streak & Top Distraksi**:
  - Melacak rekor hari konsisten belajar dan persentase waktu produktif mingguan.

---

### 6. Laporan Mingguan & Wellness Playbook
Akses melalui tab **Laporan**:
* **Insight Mingguan Berbasis AI**:
  - Rangkuman naratif yang mengevaluasi pola kerja Anda selama sepekan terakhir dengan bahasa yang suportif dan empatik.
* **Wellness Playbook Berjenjang**:
  - Rekomendasi tindakan mandiri bertahap:
    - *Langkah 1*: Pengurangan paparan layar larut malam.
    - *Langkah 2*: Aktivitas fisik ringan & jeda jalan kaki 10 menit.
    - *Langkah 3*: Dukungan sosial atau konsultasi akademik ke Bimbingan Konseling (BK) kampus jika kelelahan berlanjut.

---

### 7. Profil, Pengaturan & Manajemen Data
Akses melalui menu **Settings**:
* **Kartu Profil Mahasiswa**:
  - Menampilkan identitas, program studi, semester, status sinkronisasi kalender, serta foto profil Anda.
  - Dilengkapi badge **Penyimpanan Aman & Privat**.
* **Mode Tampilan**:
  - Tombol beralih antara **Mode Terang (Light)** dan **Mode Malam (Dark)** sesuai kenyamanan mata.
* **Kendali Privasi Sensor**:
  - Sakelar untuk mengizinkan atau menonaktifkan kamera biometrik, pelacakan jendela desktop, dan notifikasi pengingat.
* **Kedaulatan & Ekspor Data**:
  - **Ekspor Rekap Lengkap (JSON)**: Mengunduh salinan seluruh riwayat skor, tugas, dan refleksi.
  - **Ekspor Tren Harian (CSV)**: Mengunduh file spreadsheet untuk keperluan analisis mandiri.
  - **Bersihkan Cache & Reset**: Mengatur ulang preferensi ke kondisi bawaan bila diperlukan.

---

## ❓ Tanya Jawab & Pemecahan Masalah (FAQ)

### 1. Apakah NAPAS merekam atau mengambil foto dari webcam saya?
> **Sama sekali tidak.** NAPAS menggunakan komputasi lokal di memori peramban Anda untuk mengestimasi frekuensi kedipan mata. Frame visual kamera tidak pernah disimpan sebagai file gambar atau video, dan tidak pernah dikirim ke internet.

### 2. Apakah saya bisa menggunakan NAPAS jika backend offline?
> **Ya.** NAPAS dirancang dengan pendekatan *Local-First*. Jika server backend sedang tidak aktif, antarmuka web tetap dapat berjalan menggunakan penyimpanan lokal (*local storage*) di peramban Anda.

### 3. Bagaimana cara memasang NAPAS sebagai aplikasi di HP atau Laptop?
> NAPAS mendukung standar **Progressive Web App (PWA)**:
> * Di peramban Google Chrome / Microsoft Edge di laptop: Klik ikon instalasi (+ / komputer) di bilah alamat URL untuk memasang NAPAS sebagai aplikasi mandiri.
> * Di smartphone Android/iOS: Buka menu peramban lalu pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.

### 4. Mengapa tombol kalender bertuliskan "Belum Terhubung"?
> Anda dapat mengklik kartu kalender tersebut, lalu memilih **⚡ Sinkronisasi Cepat** untuk langsung mengisi jadwal semester secara instan, atau memilih opsi **🔗 Akun Google** / **📋 Impor File (.ics)** untuk menyelaraskan kalender pribadi Anda.

---

*NAPAS — Bernapas Lebih Tenang, Belajar Lebih Seimbang.* 🌿
