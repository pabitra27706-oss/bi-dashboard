import sqlite3
import os
import re
import time
import threading
from typing import Optional, Tuple, List, Dict, Any

import pandas as pd

from config import settings
from services.logger import logger

DANGEROUS_PATTERN = re.compile(
    r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REPLACE)\b",
    re.IGNORECASE,
)

_local = threading.local()


# ── connection helpers ────────────────────────────────────────────────────
def get_read_connection() -> sqlite3.Connection:
    conn: Optional[sqlite3.Connection] = getattr(_local, "read_conn", None)
    if conn is not None:
        try:
            conn.execute("SELECT 1")
            return conn
        except Exception:
            try:
                conn.close()
            except Exception:
                pass
            _local.read_conn = None

    conn = sqlite3.connect(settings.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA query_only = ON;")
    except Exception:
        pass
    _local.read_conn = conn
    logger.debug("Created new thread-local read connection")
    return conn


def get_write_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


# ── SQL validation ────────────────────────────────────────────────────────
def validate_sql(sql: str) -> Tuple[bool, str]:
    cleaned = sql.strip().rstrip(";")
    if not cleaned:
        return False, "Empty SQL query."
    if not cleaned.upper().startswith("SELECT"):
        return False, "Only SELECT statements are allowed."
    if DANGEROUS_PATTERN.search(cleaned):
        return False, "Query contains forbidden keywords."
    if cleaned.count(";") > 0:
        return False, "Multiple statements not allowed."
    return True, ""


def explain_validate(sql: str) -> Tuple[bool, str]:
    conn = get_read_connection()
    try:
        conn.execute(f"EXPLAIN {sql}")
        return True, ""
    except Exception as e:
        return False, f"SQL validation failed: {e}"


def add_limit(sql: str, limit: int = 10000) -> str:
    if "LIMIT" not in sql.upper():
        sql = sql.rstrip().rstrip(";")
        sql += f" LIMIT {limit}"
    return sql


# ── query execution ──────────────────────────────────────────────────────
def execute_query(sql: str) -> Tuple[List[Dict[str, Any]], float]:
    valid, err = validate_sql(sql)
    if not valid:
        raise ValueError(err)
    valid, err = explain_validate(sql)
    if not valid:
        raise ValueError(err)

    sql = add_limit(sql, settings.MAX_QUERY_ROWS)
    conn = get_read_connection()
    start = time.perf_counter()

    def _progress():
        if time.perf_counter() - start > settings.QUERY_TIMEOUT:
            return 1
        return 0

    conn.set_progress_handler(_progress, 10000)
    try:
        cursor = conn.execute(sql)
        rows = [dict(row) for row in cursor.fetchall()]
        elapsed = round(time.perf_counter() - start, 4)
        return rows, elapsed
    except sqlite3.OperationalError as e:
        if "interrupted" in str(e).lower():
            raise TimeoutError(
                f"Query exceeded {settings.QUERY_TIMEOUT}s timeout"
            )
        raise
    finally:
        conn.set_progress_handler(None, 0)


def execute_kpi_sql(sql: str) -> Optional[str]:
    valid, _ = validate_sql(sql)
    if not valid:
        return None
    conn = get_read_connection()
    try:
        cursor = conn.execute(sql)
        row = cursor.fetchone()
        if row:
            val = row[0]
            if isinstance(val, float):
                if abs(val) >= 1_000_000:
                    return f"{val / 1_000_000:.1f}M"
                elif abs(val) >= 1_000:
                    return f"{val / 1_000:.1f}K"
                else:
                    return f"{val:.2f}"
            elif isinstance(val, int):
                if abs(val) >= 1_000_000_000:
                    return f"{val / 1_000_000_000:.1f}B"
                elif abs(val) >= 1_000_000:
                    return f"{val / 1_000_000:.1f}M"
                elif abs(val) >= 1_000:
                    return f"{val / 1_000:.1f}K"
                return str(val)
            return str(val)
        return None
    except Exception:
        return None


# ── schema helpers ────────────────────────────────────────────────────────
def get_schema() -> Dict[str, Any]:
    conn = get_read_connection()
    tables: List[Dict[str, Any]] = []
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    )
    for row in cursor.fetchall():
        table_name = row[0]
        cols_raw = conn.execute(
            f"PRAGMA table_info('{table_name}');"
        ).fetchall()
        columns = [{"name": c[1], "type": c[2]} for c in cols_raw]
        count = conn.execute(
            f"SELECT COUNT(*) FROM '{table_name}'"
        ).fetchone()[0]
        col_names = [c[1] for c in cols_raw]
        sample_raw = conn.execute(
            f"SELECT * FROM '{table_name}' LIMIT 3"
        ).fetchall()
        sample = [dict(zip(col_names, list(r))) for r in sample_raw]
        tables.append(
            {
                "name": table_name,
                "columns": columns,
                "row_count": count,
                "sample": sample,
            }
        )
    total = sum(t["row_count"] for t in tables)
    return {"tables": tables, "row_count": total}


def table_exists(table_name: str) -> bool:
    conn = get_read_connection()
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    )
    return cursor.fetchone() is not None


def get_table_columns(table_name: str) -> List[str]:
    """Return the list of column names for *table_name*."""
    conn = get_read_connection()
    cols = conn.execute(f"PRAGMA table_info('{table_name}');").fetchall()
    return [c[1] for c in cols]


def validate_sql_columns(sql: str, table_name: str) -> Tuple[bool, str, List[str]]:
    """Check that every column referenced in *sql* actually exists."""
    valid_columns = set(get_table_columns(table_name))
    if not valid_columns:
        return True, "", []
    conn = get_read_connection()
    try:
        conn.execute(f"EXPLAIN {sql}")
        return True, "", []
    except Exception as e:
        err_str = str(e)
        if "no such column" in err_str.lower():
            match = re.search(r"no such column:\s*(\S+)", err_str, re.IGNORECASE)
            bad_col = match.group(1) if match else "unknown"
            return (
                False,
                f"Column '{bad_col}' does not exist in table '{table_name}'.",
                sorted(valid_columns),
            )
        return False, f"SQL validation failed: {e}", sorted(valid_columns)


# ── CSV / table management ────────────────────────────────────────────────
def load_csv_to_db(
    filepath: str, table_name: str = "custom_data"
) -> Dict[str, Any]:
    safe_name = re.sub(r"[^\w]", "_", table_name)
    df = pd.read_csv(filepath, nrows=settings.MAX_ROWS)
    conn = get_write_connection()
    try:
        df.to_sql(safe_name, conn, if_exists="replace", index=False)
        for col in df.select_dtypes(include=["object"]).columns:
            safe_col = re.sub(r"[^\w]", "_", col)
            try:
                conn.execute(
                    f'CREATE INDEX IF NOT EXISTS idx_{safe_name}_{safe_col} '
                    f'ON "{safe_name}"("{col}");'
                )
            except Exception:
                pass
        conn.commit()
        logger.info(f"Loaded CSV into table '{safe_name}' ({len(df)} rows)")
        old = getattr(_local, "read_conn", None)
        if old:
            try:
                old.close()
            except Exception:
                pass
            _local.read_conn = None
        return get_schema()
    finally:
        conn.close()


def drop_table(table_name: str) -> None:
    safe_name = re.sub(r"[^\w]", "_", table_name)
    conn = get_write_connection()
    try:
        conn.execute(f'DROP TABLE IF EXISTS "{safe_name}"')
        conn.commit()
        logger.info(f"Dropped table '{safe_name}'")
        old = getattr(_local, "read_conn", None)
        if old:
            try:
                old.close()
            except Exception:
                pass
            _local.read_conn = None
    finally:
        conn.close()


def preview_csv(filepath: str) -> Dict[str, Any]:
    df = pd.read_csv(filepath, nrows=100)
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            total_lines = sum(1 for _ in f) - 1
    except Exception:
        total_lines = len(df)

    columns = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        if "int" in dtype:
            col_type = "INTEGER"
        elif "float" in dtype:
            col_type = "REAL"
        else:
            col_type = "TEXT"
        columns.append({"name": str(col), "type": col_type})

    sample = df.head(5).fillna("").to_dict(orient="records")
    return {
        "row_count": max(total_lines, len(df)),
        "columns": columns,
        "sample_rows": sample,
    }


# ── UPDATE 9: auto-profiling ─────────────────────────────────────────────
def profile_table(table_name: str) -> Dict[str, Any]:
    """Generate a statistical profile of a table."""
    conn = get_read_connection()
    safe = re.sub(r"[^\w]", "_", table_name)
    profile: Dict[str, Any] = {
        "table_name": safe,
        "numeric_columns": [],
        "categorical_columns": [],
        "date_columns": [],
        "row_count": 0,
    }
    try:
        profile["row_count"] = conn.execute(
            f"SELECT COUNT(*) FROM '{safe}'"
        ).fetchone()[0]
        cols_raw = conn.execute(f"PRAGMA table_info('{safe}');").fetchall()

        for ci in cols_raw:
            name, ctype = ci[1], ci[2].upper()
            if name in ("row_id", "index"):
                continue

            # date detection
            if any(
                d in name.lower()
                for d in ("date", "time", "created", "updated", "published")
            ):
                profile["date_columns"].append(name)
                continue

            if any(t in ctype for t in ("INT", "REAL", "FLOAT", "NUM")):
                try:
                    row = conn.execute(
                        f'SELECT MIN("{name}"), MAX("{name}"), '
                        f'AVG("{name}"), COUNT(DISTINCT "{name}") '
                        f"FROM '{safe}' WHERE \"{name}\" IS NOT NULL"
                    ).fetchone()
                    profile["numeric_columns"].append(
                        {
                            "name": name,
                            "min": row[0],
                            "max": row[1],
                            "avg": round(row[2], 2) if row[2] else None,
                            "distinct": row[3],
                        }
                    )
                except Exception:
                    profile["numeric_columns"].append({"name": name})
            else:
                try:
                    top = conn.execute(
                        f'SELECT "{name}", COUNT(*) AS cnt FROM \'{safe}\' '
                        f'WHERE "{name}" IS NOT NULL '
                        f'GROUP BY "{name}" ORDER BY cnt DESC LIMIT 10'
                    ).fetchall()
                    dist = conn.execute(
                        f'SELECT COUNT(DISTINCT "{name}") FROM \'{safe}\''
                    ).fetchone()[0]
                    profile["categorical_columns"].append(
                        {
                            "name": name,
                            "distinct": dist,
                            "top_values": [
                                {"value": str(r[0]), "count": r[1]} for r in top
                            ],
                        }
                    )
                except Exception:
                    profile["categorical_columns"].append({"name": name})
    except Exception as e:
        logger.warning(f"Profiling failed for {safe}: {e}")
    return profile


def generate_starter_questions(profile: Dict[str, Any]) -> List[str]:
    """Produce 3-5 starter questions from a table profile."""
    qs: List[str] = []
    t = profile["table_name"]
    cats = profile.get("categorical_columns", [])
    nums = profile.get("numeric_columns", [])
    dates = profile.get("date_columns", [])

    if cats:
        qs.append(f"Show the distribution of records by {cats[0]['name']}")
    if nums and cats:
        qs.append(f"What is the average {nums[0]['name']} by {cats[0]['name']}?")
    if dates and nums:
        qs.append(f"Show the trend of {nums[0]['name']} over time")
    if len(nums) >= 2:
        qs.append(f"Compare {nums[0]['name']} vs {nums[1]['name']}")
    if nums:
        qs.append(f"What are the top 10 records by {nums[0]['name']}?")
    return qs[:5]