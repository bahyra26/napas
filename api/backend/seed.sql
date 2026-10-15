-- ============================================================================
-- SEED DATA DEMO RAKA (NAPAS v2) — UNTUK SUPABASE SQL EDITOR
-- Jalankan skrip ini untuk menyiapkan data awal pengujian & presentasi
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Upsert User Raka Pratama
  INSERT INTO users (nama, email, consent_camera, consent_window, baseline_blink_rate)
  VALUES ('Raka Pratama', 'raka@joints2026.ugm.ac.id', TRUE, TRUE, 15.0)
  ON CONFLICT (email) DO UPDATE 
    SET nama = EXCLUDED.nama,
        baseline_blink_rate = EXCLUDED.baseline_blink_rate
  RETURNING id INTO v_user_id;

  RAISE NOTICE 'User ID Raka: %', v_user_id;

  -- 2. Bersihkan data demo lama milik user ini
  DELETE FROM workload_items WHERE user_id = v_user_id;
  DELETE FROM daily_index WHERE user_id = v_user_id;
  DELETE FROM sensor_metrics WHERE user_id = v_user_id;
  DELETE FROM check_ins WHERE user_id = v_user_id;
  DELETE FROM interventions WHERE user_id = v_user_id;

  -- 3. Masukkan 5 Workload Items (Deadline minggu ini + agenda larut malam)
  INSERT INTO workload_items (user_id, judul, jenis, deadline, est_jam, effort, status)
  VALUES
    (v_user_id, 'Skripsi Bab 4 & 5 (Analisis Hasil)', 'tugas', NOW() + INTERVAL '14 hours', 8, 5, 'belum'),
    (v_user_id, 'Tugas Besar Pemrograman Web', 'tugas', NOW() + INTERVAL '2 days', 6, 4, 'belum'),
    (v_user_id, 'Rapat Koordinasi BEM FMIPA', 'rapat', NOW() + INTERVAL '2 days 4 hours', 2, 3, 'belum'),
    (v_user_id, 'Laporan Praktikum Machine Learning', 'tugas', NOW() + INTERVAL '3 days', 5, 4, 'belum'),
    (v_user_id, 'Revisi Makalah Jurnal Larut Malam', 'tugas', (NOW() + INTERVAL '1 day')::date + TIME '23:00:00', 4, 4, 'belum');

  -- 4. Masukkan Riwayat Tren 5 Hari Terakhir (Index Naik Beruntun: 38 -> 52 -> 64 -> 74)
  INSERT INTO daily_index (user_id, tanggal, index, zona, load_score, stress_score, dist_score, checkin_score, alasan_json, trend_flag)
  VALUES
    (v_user_id, v_today - INTERVAL '5 days', 28.0, 'hijau', 25.0, 22.0, 15.0, 25.0, '["Semua sinyal dalam batas wajar"]'::jsonb, FALSE),
    (v_user_id, v_today - INTERVAL '4 days', 38.0, 'kuning', 40.0, 35.0, 20.0, 50.0, '["2 tugas dalam 7 hari"]'::jsonb, FALSE),
    (v_user_id, v_today - INTERVAL '3 days', 52.0, 'kuning', 55.0, 48.0, 30.0, 50.0, '["3 tugas dalam 7 hari", "kedipan turun 26%"]'::jsonb, FALSE),
    (v_user_id, v_today - INTERVAL '2 days', 64.0, 'oranye', 68.0, 62.0, 35.0, 75.0, '["4 deadline dalam 7 hari", "kedipan turun 30%"]'::jsonb, TRUE),
    (v_user_id, v_today - INTERVAL '1 days', 74.5, 'oranye', 78.0, 70.0, 40.0, 75.0, '["5 deadline dalam 7 hari", "alis & otot wajah tegang konsisten"]'::jsonb, TRUE);

  -- 5. Masukkan Telemetri Sensor Hari Ini (Kondisi Stres: Kedipan rendah, alis tegang, distraksi)
  FOR i IN 1..15 LOOP
    INSERT INTO sensor_metrics (user_id, ts, blink_rate, brow_tension, jaw_tension, gaze_minutes, face_visible, focus_seconds, distraction_seconds, app_category)
    VALUES (
      v_user_id, 
      NOW() - (i * INTERVAL '15 minutes'),
      10.5,
      0.68,
      0.55,
      48.0,
      TRUE,
      1800,
      900,
      'academic'
    );
  END LOOP;

  -- 6. Masukkan Check-in Hari Ini
  INSERT INTO check_ins (user_id, ts, skor, catatan)
  VALUES (v_user_id, NOW() - INTERVAL '2 hours', 2, 'Pusing dan sulit tidur karena beban skripsi menumpuk.');

  -- 7. Masukkan Log Intervensi Selesai Hari Ini
  INSERT INTO interventions (user_id, ts, tipe, durasi, selesai)
  VALUES 
    (v_user_id, NOW() - INTERVAL '3 hours', 'breathing', 60, TRUE),
    (v_user_id, NOW() - INTERVAL '1 hour', 'break', 300, TRUE);

  RAISE NOTICE 'Seed data berhasil! Buka backend dan panggil GET /index/today?user_id=%', v_user_id;
END $$;
