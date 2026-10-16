# 🚀 Panduan Menghubungkan & Deploy NAPAS ke Vercel

Aplikasi **NAPAS** telah dikonfigurasi secara lengkap untuk dapat berjalan di **Vercel** sebagai aplikasi full-stack:
- **Frontend**: Single Page Application (SPA) React + TypeScript + Vite + Progressive Web App (PWA) dengan Service Worker.
- **Backend**: FastAPI Python Serverless Functions (`api/index.py`) yang terhubung langsung ke database cloud Supabase.

---

## 1. File Konfigurasi yang Telah Disiapkan

1. **[`vercel.json`](./vercel.json)**:
   - Framework preset: `vite`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Serverless Rewrites: Menghubungkan seluruh endpoint API (`/health`, `/users`, `/profile`, `/planner`, `/focus-sessions`, dll.) ke `api/index.py`.
   - SPA Fallback: Memastikan refresh halaman di sub-path tetap memuat `index.html`.
   - PWA & Security Headers: Cache control tanpa jeda untuk `sw.js`, manifest MIME type, dan header keamanan HTTP.
2. **[`api/index.py`](./api/index.py)**:
   - Handler Serverless ASGI untuk FastAPI app.
3. **[`requirements.txt`](./requirements.txt)**:
   - Dependensi runtime Python untuk Vercel Serverless (`fastapi`, `supabase`, `pydantic`, `python-dotenv`, `uvicorn`).
4. **[`.env.example`](./.env.example)**:
   - Daftar seluruh Environment Variables yang diperlukan di Vercel.

---

## 2. Cara Menghubungkan ke Vercel (Pilih Salah Satu)

### Cara 1: Menghubungkan via GitHub (Paling Mudah & Otomatis) ⭐

Karena proyek ini sudah terhubung ke repository GitHub: `https://github.com/bahyra26/napas.git`, ini adalah cara tercepat:

1. Buka dashboard Vercel di browser: **[https://vercel.com/new](https://vercel.com/new)**.
2. Login dengan akun GitHub Anda.
3. Pada bagian **"Import Git Repository"**, cari dan pilih repository **`bahyra26/napas`**, lalu klik **Import**.
4. Di halaman konfigurasi proyek:
   - **Framework Preset**: Vercel otomatis mendeteksi **Vite**.
   - **Root Directory**: Biarkan `./`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
5. Buka bagian **"Environment Variables"** dan tambahkan 4 variabel berikut:
   | Key | Value |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | `https://enzizvrvfogjjgctpmli.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueml6dnJ2Zm9nampnY3RwbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2MTY2NywiZXhwIjoyMTA0OTM3NjY3fQ.WRZlF1Mn8rv-yX--mv6go5YQXYS-xix2vMPrF8VzG9o` |
   | `SUPABASE_URL` | `https://enzizvrvfogjjgctpmli.supabase.co` |
   | `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueml6dnJ2Zm9nampnY3RwbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2MTY2NywiZXhwIjoyMTA0OTM3NjY3fQ.WRZlF1Mn8rv-yX--mv6go5YQXYS-xix2vMPrF8VzG9o` |
6. Klik tombol **Deploy**!
7. Vercel akan mengkompilasi kode Anda dalam ~1 menit dan memberikan domain publik gratis bersertifikat SSL (misal: `https://napas.vercel.app`).
8. Setiap kali Anda melakukan `git push` ke GitHub, Vercel akan otomatis mendeploy versi terbaru secara instan.

---

### Cara 2: Menghubungkan via Vercel CLI (Terminal)

Jika ingin menghubungkan langsung dari terminal:

1. Jalankan perintah inisialisasi:
   ```bash
   npx vercel
   ```
2. Tekan tombol login di browser yang terbuka untuk mengautentikasi akun Vercel Anda.
3. Jawab pertanyaan interaktif CLI:
   - *Set up and deploy?* -> Tekan **y**
   - *Which scope do you want to deploy to?* -> Pilih akun Anda
   - *Link to existing project?* -> Tekan **n**
   - *What's your project's name?* -> Tekan Enter (`napas`)
   - *In which directory is your code located?* -> Tekan Enter (`./`)
   - *Want to modify settings?* -> Tekan **n**
4. Masukkan Environment Variables menggunakan CLI:
   ```bash
   npx vercel env add VITE_SUPABASE_URL production
   npx vercel env add VITE_SUPABASE_ANON_KEY production
   npx vercel env add SUPABASE_URL production
   npx vercel env add SUPABASE_KEY production
   ```
5. Deploy versi final ke Production:
   ```bash
   npx vercel --prod
   ```

---

## 3. Menyiapkan Perubahan ke Git Sebelum Deploy

Pastikan semua pembaruan fitur (Realtime, Dark Mode, PWA, Validasi Modal) telah di-commit ke Git:

```bash
git add .
git commit -m "feat: integrate realtime sync, PWA installable, and vercel deployment"
git push origin main
```
