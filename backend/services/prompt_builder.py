import json
from typing import List, Dict, Any, Optional
from services.db_service import get_schema
from services.logger import logger

# ---------------------------------------------------------------------------
# RAG-style synonym map for intelligent schema filtering
# ---------------------------------------------------------------------------
COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "views": ["watched", "seen", "popular", "viral", "view count", "plays"],
    "likes": ["liked", "favorite", "loved", "appreciation", "thumbs up"],
    "comments": ["commented", "replies", "feedback", "discussion"],
    "shares": ["shared", "forwarded", "spread"],
    "publish_date": [
        "when", "date", "time", "month", "year", "trend", "timeline",
        "published", "upload date", "monthly", "daily", "weekly",
    ],
    "category": ["type", "genre", "kind", "topic"],
    "region": ["country", "location", "area", "geography", "where", "place"],
    "language": ["lang", "tongue", "spoken"],
    "sentiment_score": [
        "sentiment", "feeling", "positive", "negative", "mood", "opinion",
        "emotion",
    ],
    "subscribers": ["follower", "subscriber", "audience", "fans"],
    "duration_seconds": [
        "duration", "length", "long", "short", "minutes", "seconds",
        "runtime", "watch time",
    ],
    "ads_enabled": [
        "monetized", "monetization", "ads", "revenue", "money", "ad",
        "earning",
    ],
    "title": ["name", "video name", "video title"],
    "video_id": ["id", "vid"],
}

ALWAYS_INCLUDE_COLUMNS = {"row_id", "video_id", "title"}


def _get_relevant_columns(
    query: str, table_columns: List[Dict[str, str]]
) -> List[Dict[str, str]]:
    """RAG-style column filtering — keep only what the query likely needs."""
    q_lower = query.lower()
    col_names = {c["name"] for c in table_columns}
    relevant: set[str] = set()

    # Always keep identifier columns present in the table
    for ac in ALWAYS_INCLUDE_COLUMNS:
        if ac in col_names:
            relevant.add(ac)

    # Direct column-name match
    for col in table_columns:
        if col["name"].lower() in q_lower or col["name"].replace("_", " ").lower() in q_lower:
            relevant.add(col["name"])

    # Synonym match
    for col_name, synonyms in COLUMN_SYNONYMS.items():
        if col_name in col_names:
            for syn in synonyms:
                if syn in q_lower:
                    relevant.add(col_name)
                    break

    # Fallback: if almost nothing matched, send everything
    if len(relevant) <= len(ALWAYS_INCLUDE_COLUMNS) + 1:
        return table_columns

    # Guarantee at least one numeric & one categorical for charting
    has_numeric = any(
        c["name"] in relevant and c["type"] in ("INTEGER", "REAL")
        for c in table_columns
    )
    has_text = any(
        c["name"] in relevant and c["type"] == "TEXT" for c in table_columns
    )
    if not has_numeric:
        for c in table_columns:
            if c["type"] in ("INTEGER", "REAL") and c["name"] != "row_id":
                relevant.add(c["name"])
                break
    if not has_text:
        for c in table_columns:
            if c["type"] == "TEXT":
                relevant.add(c["name"])
                break

    filtered = [c for c in table_columns if c["name"] in relevant]
    logger.debug(
        f"RAG filter: {len(table_columns)} -> {len(filtered)} cols "
        f"for '{query[:60]}'"
    )
    return filtered


# ---------------------------------------------------------------------------
# Anti-hallucination block (injected into both system prompts)
# ---------------------------------------------------------------------------
ANTI_HALLUCINATION_RULES = """
CRITICAL DATA INTEGRITY RULES:
- ONLY use columns that exist in the schema provided above.
- If the user asks about data or columns that do NOT exist, respond with:
  {"sql": "", "chart_config": null, "insight": "I don't have data for that. The available columns are: [list them]. Try asking about one of these instead.", "kpis": [], "follow_up_questions": ["suggestion1","suggestion2","suggestion3"], "assumptions": [], "confidence": "high"}
- NEVER invent column names, table names, or data values.
- If the question is ambiguous, state your interpretation in the insight.
- Include an "assumptions" field: list every assumption you made.
- Include a "confidence" field: "high" | "medium" | "low".
"""

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_YOUTUBE = (
    "You are an elite data analyst AI powering an executive BI dashboard.\n"
    "Convert natural-language questions into SQLite queries and chart specs.\n\n"
    "STRICT RULES:\n"
    "1. Return ONLY valid JSON. No markdown fences, no extra text.\n"
    "2. SQL must be valid SQLite syntax. Use strftime for dates.\n"
    "3. SQL must be SELECT only. No mutations.\n"
    "4. Always alias computed columns clearly: total_views, avg_likes, etc.\n"
    "5. For time series use: strftime('%Y-%m', publish_date) AS month\n"
    "6. For top N use subqueries.\n"
    "7. Keep results under 500 rows. Add LIMIT if needed.\n"
    "8. ads_enabled is INTEGER: 1 = monetized, 0 = not.\n"
    "9. sentiment_score: -1.0 (negative) to 1.0 (positive). 0 = neutral.\n"
    "10. For group comparisons, structure data for grouped bars.\n"
    "11. Provide 2-4 KPIs with their own SQL queries.\n"
    "12. Provide 2-3 follow-up questions.\n"
    "13. Insight should be 2-4 sentences with actual numbers.\n"
    "14. row_id is auto-increment — do NOT use it in queries.\n"
    "15. Categories: Coding, Education, Gaming, Music, Tech Reviews, Vlogs\n"
    "16. Regions include: PK, UK, BR, IN, US, and others\n"
    "17. Languages include: English, Urdu, Japanese, and others\n"
    "18. Date range: 2024-01-01 to 2025-12-30\n"
    "19. Table has 1,000,000 rows\n"
    + ANTI_HALLUCINATION_RULES
    + "\nCHART TYPES: bar, grouped_bar, stacked_bar, line, area, pie, donut, scatter\n"
    "ANNOTATIONS (optional): {\"type\":\"line\",\"value\":number,\"label\":\"text\",\"color\":\"#hex\"}\n"
    "COLOR PALETTE: [\"#6366F1\",\"#8B5CF6\",\"#EC4899\",\"#F43F5E\",\"#F59E0B\",\"#10B981\",\"#06B6D4\",\"#3B82F6\"]\n"
)

SYSTEM_PROMPT_GENERIC = (
    "You are an elite data analyst AI powering an executive BI dashboard.\n"
    "Convert natural-language questions into SQLite queries and chart specs.\n\n"
    "STRICT RULES:\n"
    "1. Return ONLY valid JSON. No markdown fences, no extra text.\n"
    "2. SQL must be valid SQLite syntax.\n"
    "3. SQL must be SELECT only. No mutations.\n"
    "4. Always alias computed columns clearly.\n"
    "5. Keep results under 500 rows. Add LIMIT if needed.\n"
    "6. Provide 2-4 KPIs with their own SQL queries.\n"
    "7. Provide 2-3 follow-up questions.\n"
    "8. Insight should be 2-4 sentences with actual numbers.\n"
    "9. Examine the schema and sample data carefully.\n"
    + ANTI_HALLUCINATION_RULES
    + "\nCHART TYPES: bar, grouped_bar, stacked_bar, line, area, pie, donut, scatter\n"
    "ANNOTATIONS (optional): {\"type\":\"line\",\"value\":number,\"label\":\"text\",\"color\":\"#hex\"}\n"
    "COLOR PALETTE: [\"#6366F1\",\"#8B5CF6\",\"#EC4899\",\"#F43F5E\",\"#F59E0B\",\"#10B981\",\"#06B6D4\",\"#3B82F6\"]\n"
)

OUTPUT_FORMAT = """
RESPOND WITH EXACTLY THIS JSON (no markdown, no explanation):
{
  "sql": "SELECT ...",
  "chart_config": {
    "chart_type": "bar",
    "title": "Chart Title",
    "x_axis": "column_alias_for_x",
    "x_label": "X Axis Label",
    "y_axis": ["y_alias1"],
    "y_label": "Y Axis Label",
    "group_by": null,
    "colors": ["#6366F1"],
    "annotations": []
  },
  "additional_charts": [],
  "insight": "Executive summary with numbers...",
  "kpis": [
    {"label":"Total Views","sql":"SELECT SUM(views) FROM youtube_data","icon":"eye","trend":"+12%","trend_direction":"up"}
  ],
  "follow_up_questions": ["Question 1?","Question 2?"],
  "assumptions": ["Interpreted 'engagement' as (likes+comments+shares)/views"],
  "confidence": "high"
}
"""


# ---------------------------------------------------------------------------
# Schema text builder (shared by all prompt builders)
# ---------------------------------------------------------------------------
def _build_schema_text(
    schema: Dict[str, Any], user_query: str, use_rag: bool = True
) -> str:
    text = ""
    for tbl in schema.get("tables", []):
        cols = tbl["columns"]
        all_cols = ", ".join(f'{c["name"]} ({c["type"]})' for c in cols)
        text += f'\nTable: {tbl["name"]}\n'
        text += f"All columns: {all_cols}\n"
        if use_rag:
            relevant = _get_relevant_columns(user_query, cols)
            rel_cols = ", ".join(f'{c["name"]} ({c["type"]})' for c in relevant)
            text += f"Most relevant for this query: {rel_cols}\n"
        text += f'Row count: {tbl["row_count"]:,}\n'
        if tbl.get("sample"):
            text += f'Sample: {json.dumps(tbl["sample"][:2], default=str)}\n'
    return text


# ---------------------------------------------------------------------------
# Primary prompt
# ---------------------------------------------------------------------------
def build_prompt(
    user_query: str,
    conversation_history: Optional[list] = None,
    custom_schema: Optional[dict] = None,
    active_table: Optional[str] = None,
) -> str:
    schema = custom_schema or get_schema()

    if active_table:
        filtered = [
            t for t in schema.get("tables", []) if t["name"] == active_table
        ]
        if filtered:
            schema = {"tables": filtered, "row_count": filtered[0]["row_count"]}
            logger.info(f"Prompt scoped to table: {active_table}")

    is_youtube = (active_table is None) or (active_table == "youtube_data")
    system_prompt = SYSTEM_PROMPT_YOUTUBE if is_youtube else SYSTEM_PROMPT_GENERIC

    schema_text = _build_schema_text(schema, user_query)

    context = ""
    if conversation_history:
        context = "\n\nPREVIOUS CONVERSATION:\n"
        for turn in conversation_history[-5:]:
            context += f'User: {turn.get("query", "")}\n'
            context += f'SQL: {turn.get("sql", "")}\n'
            context += f'Insight: {turn.get("insight", "")}\n\n'

    return f"""{system_prompt}

DATABASE SCHEMA:
{schema_text}
{context}
USER QUESTION:
"{user_query}"

{OUTPUT_FORMAT}
"""


# ---------------------------------------------------------------------------
# Modification prompt (UPDATE 6)
# ---------------------------------------------------------------------------
def build_modification_prompt(
    user_query: str,
    previous_sql: str,
    previous_chart_config: Optional[dict],
    active_table: Optional[str] = None,
    custom_schema: Optional[dict] = None,
) -> str:
    schema = custom_schema or get_schema()
    if active_table:
        filtered = [
            t for t in schema.get("tables", []) if t["name"] == active_table
        ]
        if filtered:
            schema = {"tables": filtered, "row_count": filtered[0]["row_count"]}

    is_youtube = (active_table is None) or (active_table == "youtube_data")
    system_prompt = SYSTEM_PROMPT_YOUTUBE if is_youtube else SYSTEM_PROMPT_GENERIC
    schema_text = _build_schema_text(schema, user_query, use_rag=False)

    prev_chart = json.dumps(previous_chart_config, default=str) if previous_chart_config else "{}"

    return f"""{system_prompt}

DATABASE SCHEMA:
{schema_text}

PREVIOUS CONTEXT — the user wants to MODIFY this result:
Previous SQL: {previous_sql}
Previous chart config: {prev_chart}

Apply the user's modification while keeping the same general structure.

MODIFICATION REQUEST:
"{user_query}"

{OUTPUT_FORMAT}
"""


# ---------------------------------------------------------------------------
# Self-correction / fix prompt (UPDATE 5)
# ---------------------------------------------------------------------------
def build_fix_prompt(
    user_query: str,
    failed_sql: str,
    error_message: str,
    active_table: Optional[str] = None,
    custom_schema: Optional[dict] = None,
) -> str:
    schema = custom_schema or get_schema()
    if active_table:
        filtered = [
            t for t in schema.get("tables", []) if t["name"] == active_table
        ]
        if filtered:
            schema = {"tables": filtered, "row_count": filtered[0]["row_count"]}

    schema_text = _build_schema_text(schema, user_query, use_rag=False)

    return f"""You are a SQL expert. A query failed and needs to be fixed.

DATABASE SCHEMA:
{schema_text}

ORIGINAL USER QUESTION:
"{user_query}"

FAILED SQL:
{failed_sql}

ERROR:
{error_message}

Fix the SQL. Common issues: non-existent columns, wrong syntax, missing quotes, wrong date format.

{OUTPUT_FORMAT}
"""