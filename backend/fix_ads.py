import sqlite3
import random

conn = sqlite3.connect("database.db")

# Get all row_ids
rows = conn.execute("SELECT row_id FROM youtube_data").fetchall()
print(f"Total rows: {len(rows)}")

# Randomly set ~50% to ads_enabled = 1
batch = []
for (rid,) in rows:
    val = 1 if random.random() < 0.5 else 0
    batch.append((val, rid))

conn.executemany("UPDATE youtube_data SET ads_enabled = ? WHERE row_id = ?", batch)
conn.commit()

c = conn.execute("SELECT ads_enabled, COUNT(*) FROM youtube_data GROUP BY ads_enabled")
for row in c:
    print(row)

conn.close()
print("Done!")