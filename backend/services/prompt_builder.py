import json
from services.db_service import get_schema

SYSTEM_PROMPT = """You are an elite data analyst AI powering an executive BI dashboard.
Convert natural-language questions into SQLite queries and chart specifications.

STRICT RULES:
1. Return ONLY valid JSON. No markdown fences, no extra text.
2. SQL must be valid SQLite syntax. Use strftime for dates.
3. SQL must be SELECT only. No mutations.
4. Always alias computed columns clearly: total_views, avg_likes, etc.
5. For time series use: strftime('%Y-%m', publish_date) AS month
6. For top N use subqueries: WHERE category IN (SELECT category FROM ... ORDER BY ... LIMIT N)
7. Keep results under 500 rows. Add LIMIT if needed.
8. The ads_enabled column is INTEGER: 1 = monetized/enabled, 0 = not monetized/disabled
9. sentiment_score ranges from -1.0 (negative) to 1.0 (positive). 0 is neutral.
10. For comparing groups (monetized vs not), structure data so frontend can render grouped bars.
11. Provide 2-4 KPIs with their own SQL queries.
12. Provide 2-3 follow-up questions the user might ask next.
13. The insight should be 2-4 sentences with actual numbers.
14. The table has an auto-increment row_id column - do NOT use it in queries.
15. The categories are: Coding, Education, Gaming, Music, Tech Reviews, Vlogs
16. The regions include: PK, UK, BR, IN, US, and others
17. The languages include: English, Urdu, Japanese, and others
18. Date range is 2024-01-01 to 2025-12-30
19. The table has 1,000,000 rows

CHART TYPES AVAILABLE:
bar, grouped_bar, stacked_bar, line, area, pie, donut, scatter

ANNOTATIONS (optional, for line/area charts):
Use to highlight interesting data points. Each: {"type":"line","value":number,"label":"text","color":"#hex"}

COLOR PALETTE (use in order):
["#6366F1","#8B5CF6","#EC4899","#F43F5E","#F59E0B","#10B981","#06B6D4","#3B82F6"]
"""

OUTPUT_FORMAT = """
RESPOND WITH EXACTLY THIS JSON STRUCTURE (no markdown, no explanation):
{
  "sql": "SELECT ...",
  "chart_config": {
    "chart_type": "bar",
    "title": "Chart Title",
    "x_axis": "column_alias_for_x",
    "x_label": "X Axis Display Label",
    "y_axis": ["column_alias_for_y1", "column_alias_for_y2"],
    "y_label": "Y Axis Display Label",
    "group_by": null,
    "colors": ["#6366F1"],
    "annotations": []
  },
  "additional_charts": [],
  "insight": "Executive summary with numbers...",
  "kpis": [
    {
      "label": "Total Views",
      "sql": "SELECT SUM(views) FROM youtube_data",
      "icon": "eye",
      "trend": "+12%",
      "trend_direction": "up"
    }
  ],
  "follow_up_questions": ["Question 1?", "Question 2?"]
}
"""


def build_prompt(user_query, conversation_history=None, custom_schema=None):
    schema = custom_schema or get_schema()

    schema_text = ""
    for tbl in schema.get("tables", []):
        cols = ", ".join([f'{c["name"]} ({c["type"]})' for c in tbl["columns"]])
        schema_text += f'\nTable: {tbl["name"]}\n'
        schema_text += f'Columns: {cols}\n'
        schema_text += f'Row count: {tbl["row_count"]:,}\n'
        if tbl.get("sample"):
            schema_text += f'Sample: {json.dumps(tbl["sample"][:2], default=str)}\n'

    context = ""
    if conversation_history:
        context = "\n\nPREVIOUS CONVERSATION (use for context on follow-ups):\n"
        for turn in conversation_history[-5:]:
            context += f'User asked: {turn.get("query", "")}\n'
            context += f'SQL used: {turn.get("sql", "")}\n'
            context += f'Insight: {turn.get("insight", "")}\n\n'

    return f"""{SYSTEM_PROMPT}

DATABASE SCHEMA:
{schema_text}
{context}
USER QUESTION:
"{user_query}"

{OUTPUT_FORMAT}
"""