import sqlite3

conn = sqlite3.connect('backend/napas_local.db')
c = conn.cursor()

dummy_patterns = [
    '%Kecerdasan Buatan%',
    '%Algoritma Genetika%',
    '%Kolaborasi Web%',
    '%Rekayasa Perangkat Lunak%',
    '%Jaringan Komputer & Cloud%',
    '%Etika Profesi%',
    '%Presentasi Proyek AI%',
    '%Tugas Besar Algoritma%',
    '%Probabilitas%',
    '%JOINTS%',
    '%Kalkulus Fisika%',
    '%Laporan Praktikum%'
]

for pat in dummy_patterns:
    c.execute("DELETE FROM workload_items WHERE judul LIKE ?", (pat,))

conn.commit()

c.execute("SELECT id, user_id, judul, source FROM workload_items")
rows = c.fetchall()
print(f"Pembersihan selesai! Sisa item tugas real: {len(rows)}")
for r in rows:
    print(r)

conn.close()
