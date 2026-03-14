import sqlite3
import csv
import os
import random
import math
from datetime import datetime, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "..", "database.db")
CSV_PATH = os.path.join(BASE, "youtube_data.csv")

SCHEMA = """
CREATE TABLE IF NOT EXISTS youtube_data (
    row_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id         TEXT,
    title            TEXT,
    category         TEXT,
    region           TEXT,
    language         TEXT,
    views            INTEGER,
    likes            INTEGER,
    comments         INTEGER,
    shares           INTEGER,
    ads_enabled      INTEGER,
    publish_date     TEXT,
    sentiment_score  REAL,
    duration_seconds INTEGER,
    subscribers      INTEGER
);
"""

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_category    ON youtube_data(category);",
    "CREATE INDEX IF NOT EXISTS idx_region      ON youtube_data(region);",
    "CREATE INDEX IF NOT EXISTS idx_language    ON youtube_data(language);",
    "CREATE INDEX IF NOT EXISTS idx_ads         ON youtube_data(ads_enabled);",
    "CREATE INDEX IF NOT EXISTS idx_pubdate     ON youtube_data(publish_date);",
    "CREATE INDEX IF NOT EXISTS idx_cat_date    ON youtube_data(category, publish_date);",
    "CREATE INDEX IF NOT EXISTS idx_reg_ads     ON youtube_data(region, ads_enabled);",
    "CREATE INDEX IF NOT EXISTS idx_vid         ON youtube_data(video_id);",
]

TITLE_STARTS = [
    "How to", "Best of", "Top 10", "Ultimate Guide to", "Why",
    "Amazing", "Unbelievable", "Review:", "Tutorial:", "Explained:",
]
TITLE_ENDS = [
    "in 2024", "in 2025", "You Need to See", "for Beginners",
    "Gone Wrong", "Challenge", "Compilation", "Full Episode",
]


def safe_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def parse_date(val):
    if not val or not isinstance(val, str):
        return "2024-01-01"
    val = val.strip()
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%d-%m-%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(val.split(".")[0].strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    if len(val) >= 10:
        return val[:10]
    return "2024-01-01"


def clean_key(key):
    """Remove any garbage characters from column name."""
    cleaned = ""
    for ch in key:
        if ch.isalnum() or ch == "_":
            cleaned += ch
    # Find known column names inside the garbage
    known = ["timestamp", "video_id", "category", "language", "region",
             "duration_sec", "views", "likes", "comments", "shares",
             "sentiment_score", "ads_enabled"]
    for k in known:
        if k in key.lower():
            return k
    return cleaned


def load_csv(conn):
    print(f"Loading CSV: {CSV_PATH}")
    print("This may take 2-5 minutes for 1M+ rows...")

    with open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)

        # Clean column names
        raw_fields = reader.fieldnames or []
        clean_fields = [clean_key(k) for k in raw_fields]
        print(f"Raw columns:     {raw_fields}")
        print(f"Cleaned columns: {clean_fields}")

        # Build mapping: raw_key -> clean_key
        field_map = dict(zip(raw_fields, clean_fields))

        batch = []
        count = 0
        skipped = 0

        for raw_row in reader:
            try:
                # Remap keys
                row = {}
                for raw_key, value in raw_row.items():
                    clean = field_map.get(raw_key, raw_key)
                    row[clean] = value

                vid = (row.get("video_id") or "").strip()
                if not vid:
                    skipped += 1
                    continue

                cat = (row.get("category") or "Unknown").strip()
                title = f"{random.choice(TITLE_STARTS)} {cat} {random.choice(TITLE_ENDS)}"

                ts = (row.get("timestamp") or "").strip()
                pub_date = parse_date(ts)

                v = safe_int(row.get("views", 0))
                subs = random.randint(max(100, v // 100), max(1000, v // 10))

                batch.append((
                    vid,
                    title,
                    cat,
                    (row.get("region") or "Unknown").strip(),
                    (row.get("language") or "Unknown").strip(),
                    safe_int(row.get("views", 0)),
                    safe_int(row.get("likes", 0)),
                    safe_int(row.get("comments", 0)),
                    safe_int(row.get("shares", 0)),
                    safe_int(row.get("ads_enabled", 0)),
                    pub_date,
                    safe_float(row.get("sentiment_score", 0.0)),
                    safe_int(row.get("duration_sec", 0)),
                    subs,
                ))
                count += 1

                if len(batch) >= 50000:
                    conn.executemany(
                        "INSERT INTO youtube_data (video_id,title,category,region,language,views,likes,comments,shares,ads_enabled,publish_date,sentiment_score,duration_seconds,subscribers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        batch,
                    )
                    conn.commit()
                    print(f"  {count:,} rows loaded...")
                    batch = []

            except Exception as e:
                skipped += 1
                if skipped <= 5:
                    print(f"  Skipped row: {e}")
                continue

        if batch:
            conn.executemany(
                "INSERT INTO youtube_data (video_id,title,category,region,language,views,likes,comments,shares,ads_enabled,publish_date,sentiment_score,duration_seconds,subscribers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                batch,
            )
            conn.commit()

    print(f"Total loaded: {count:,} rows. Skipped: {skipped:,} bad rows.")


def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Removed old database.")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute(SCHEMA)
    conn.commit()

    if os.path.exists(CSV_PATH):
        load_csv(conn)
    else:
        print(f"ERROR: No CSV found at {CSV_PATH}")
        conn.close()
        return

    print("Creating indexes...")
    for idx in INDEXES:
        conn.execute(idx)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM youtube_data").fetchone()[0]

    print("\nSample data:")
    cur = conn.execute("SELECT video_id, category, region, language, views, publish_date, sentiment_score FROM youtube_data LIMIT 5")
    for row in cur.fetchall():
        print(f"  {row}")

    # Show date range
    min_date = conn.execute("SELECT MIN(publish_date) FROM youtube_data").fetchone()[0]
    max_date = conn.execute("SELECT MAX(publish_date) FROM youtube_data").fetchone()[0]
    print(f"\nDate range: {min_date} to {max_date}")

    # Show categories
    cats = conn.execute("SELECT DISTINCT category FROM youtube_data ORDER BY category").fetchall()
    print(f"Categories: {[c[0] for c in cats]}")

    print(f"\n=== Database ready: {count:,} rows in youtube_data ===")
    conn.close()


if __name__ == "__main__":
    main()