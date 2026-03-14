import sqlite3
import os
import re
import time
from typing import Optional, Tuple, List, Dict, Any
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database.db")

DANGEROUS_PATTERN = re.compile(
    r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REPLACE)\b",
    re.IGNORECASE,
)


def get_connection(readonly: bool = True) -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    if readonly:
        try:
            conn.execute("PRAGMA query_only = ON;")
        except Exception:
            pass
    return conn


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


def add_limit(sql: str, limit: int = 10000) -> str:
    if "LIMIT" not in sql.upper():
        sql = sql.rstrip().rstrip(";")
        sql += f" LIMIT {limit}"
    return sql


def execute_query(sql: str) -> Tuple[List[Dict[str, Any]], float]:
    valid, err = validate_sql(sql)
    if not valid:
        raise ValueError(err)

    sql = add_limit(sql)
    conn = get_connection(readonly=True)
    try:
        start = time.perf_counter()
        cursor = conn.execute(sql)
        rows = [dict(row) for row in cursor.fetchall()]
        elapsed = round(time.perf_counter() - start, 4)
        return rows, elapsed
    finally:
        conn.close()


def execute_kpi_sql(sql: str) -> Optional[str]:
    valid, _ = validate_sql(sql)
    if not valid:
        return None
    conn = get_connection(readonly=True)
    try:
        cursor = conn.execute(sql)
        row = cursor.fetchone()
        if row:
            val = row[0]
            if isinstance(val, float):
                if abs(val) >= 1_000_000:
                    return f"{val/1_000_000:.1f}M"
                elif abs(val) >= 1_000:
                    return f"{val/1_000:.1f}K"
                else:
                    return f"{val:.2f}"
            elif isinstance(val, int):
                if abs(val) >= 1_000_000_000:
                    return f"{val/1_000_000_000:.1f}B"
                elif abs(val) >= 1_000_000:
                    return f"{val/1_000_000:.1f}M"
                elif abs(val) >= 1_000:
                    return f"{val/1_000:.1f}K"
                return str(val)
            return str(val)
        return None
    except Exception:
        return None
    finally:
        conn.close()


def get_schema() -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    try:
        tables = []
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
        )
        for (table_name,) in cursor.fetchall():
            cols_raw = conn.execute(f"PRAGMA table_info('{table_name}');").fetchall()
            columns = [{"name": c[1], "type": c[2]} for c in cols_raw]

            count = conn.execute(f"SELECT COUNT(*) FROM '{table_name}'").fetchone()[0]

            col_names = [c[1] for c in cols_raw]
            sample_raw = conn.execute(f"SELECT * FROM '{table_name}' LIMIT 3").fetchall()
            sample = [dict(zip(col_names, row)) for row in sample_raw]

            tables.append({
                "name": table_name,
                "columns": columns,
                "row_count": count,
                "sample": sample,
            })

        total = sum(t["row_count"] for t in tables)
        return {"tables": tables, "row_count": total}
    finally:
        conn.close()


def load_csv_to_db(filepath: str, table_name: str = "custom_data") -> Dict[str, Any]:
    safe_name = re.sub(r"[^\w]", "_", table_name)
    df = pd.read_csv(filepath, nrows=1_000_000)
    conn = sqlite3.connect(DB_PATH)
    try:
        df.to_sql(safe_name, conn, if_exists="replace", index=False)
        for col in df.select_dtypes(include=["object"]).columns:
            safe_col = re.sub(r"[^\w]", "_", col)
            try:
                conn.execute(
                    f'CREATE INDEX IF NOT EXISTS idx_{safe_name}_{safe_col} ON "{safe_name}"("{col}");'
                )
            except Exception:
                pass
        conn.commit()
        return get_schema()
    finally:
        conn.close()