import os
import time
import traceback
from fastapi import APIRouter, UploadFile, File, Form
from models.schemas import (
    QueryRequest, QueryResponse, ChartConfig, KPI,
    SchemaResponse, SuggestionResponse, Annotation,
)
from services.prompt_builder import build_prompt
from services.gemini_service import query_gemini
from services.db_service import (
    execute_query, execute_kpi_sql, get_schema, load_csv_to_db, validate_sql,
)

router = APIRouter(prefix="/api")


@router.post("/query", response_model=QueryResponse)
def process_query(req: QueryRequest):
    t0 = time.perf_counter()
    try:
        prompt = build_prompt(req.query, req.conversation_history)
        gemini_result = query_gemini(prompt)

        sql = gemini_result.get("sql", "")
        if not sql:
            return QueryResponse(
                success=False, query=req.query,
                error="AI did not generate a SQL query. Try rephrasing.",
                execution_time=round(time.perf_counter() - t0, 3),
            )

        valid, err = validate_sql(sql)
        if not valid:
            return QueryResponse(
                success=False, query=req.query, sql=sql, error=f"Invalid SQL: {err}",
                execution_time=round(time.perf_counter() - t0, 3),
            )

        data, exec_time = execute_query(sql)

        cc = gemini_result.get("chart_config", {})
        if not isinstance(cc, dict):
            cc = {}

        y_axis_raw = cc.get("y_axis", [])
        if isinstance(y_axis_raw, str):
            y_axis_raw = [y_axis_raw]
        if not isinstance(y_axis_raw, list):
            y_axis_raw = []

        chart_config = ChartConfig(
            chart_type=str(cc.get("chart_type", "bar")),
            title=str(cc.get("title", "Query Results")),
            x_axis=str(cc.get("x_axis", "")),
            x_label=str(cc.get("x_label", "")),
            y_axis=y_axis_raw,
            y_label=str(cc.get("y_label", "")),
            group_by=cc.get("group_by"),
            colors=cc.get("colors", ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E"]),
            annotations=[
                Annotation(**a) for a in cc.get("annotations", [])
                if isinstance(a, dict)
            ],
        )

        if data and not chart_config.x_axis:
            keys = list(data[0].keys())
            chart_config.x_axis = keys[0]
            chart_config.y_axis = keys[1:]

        additional_charts = []
        for ac in gemini_result.get("additional_charts", []):
            if isinstance(ac, dict):
                ac_y = ac.get("y_axis", [])
                if isinstance(ac_y, str):
                    ac_y = [ac_y]
                if not isinstance(ac_y, list):
                    ac_y = []
                additional_charts.append(ChartConfig(
                    chart_type=str(ac.get("chart_type", "bar")),
                    title=str(ac.get("title", "")),
                    x_axis=str(ac.get("x_axis", chart_config.x_axis)),
                    x_label=str(ac.get("x_label", "")),
                    y_axis=ac_y,
                    y_label=str(ac.get("y_label", "")),
                    group_by=ac.get("group_by"),
                    colors=ac.get("colors", ["#6366F1", "#8B5CF6", "#EC4899"]),
                    annotations=[
                        Annotation(**a) for a in ac.get("annotations", [])
                        if isinstance(a, dict)
                    ],
                ))

        kpis = []
        for k in gemini_result.get("kpis", []):
            if not isinstance(k, dict):
                continue
            try:
                kpi_sql = k.get("sql", "")
                if kpi_sql and isinstance(kpi_sql, str):
                    val = execute_kpi_sql(kpi_sql)
                else:
                    val = k.get("value", "N/A")
                kpis.append(KPI(
                    label=str(k.get("label", "Metric") or "Metric"),
                    value=str(val) if val else "N/A",
                    icon=str(k.get("icon", "bar-chart") or "bar-chart"),
                    trend=str(k["trend"]) if k.get("trend") else None,
                    trend_direction=str(k.get("trend_direction") or "neutral"),
                ))
            except Exception as e:
                print(f"KPI parse error: {e}")
                continue

        follow_ups = gemini_result.get("follow_up_questions", [])
        if not isinstance(follow_ups, list):
            follow_ups = []

        return QueryResponse(
            success=True,
            query=req.query,
            sql=sql,
            data=data,
            chart_config=chart_config,
            additional_charts=additional_charts,
            insight=str(gemini_result.get("insight", "")),
            kpis=kpis,
            follow_up_questions=follow_ups,
            execution_time=round(time.perf_counter() - t0, 3),
        )

    except Exception as e:
        traceback.print_exc()
        return QueryResponse(
            success=False,
            query=req.query,
            error=str(e),
            execution_time=round(time.perf_counter() - t0, 3),
        )


@router.get("/schema", response_model=SchemaResponse)
def schema_info():
    info = get_schema()
    return SchemaResponse(tables=info["tables"], row_count=info["row_count"])


@router.get("/suggestions", response_model=SuggestionResponse)
def suggestions():
    items = [
        {
            "query": "Show me the total views by category",
            "difficulty": "Simple",
            "description": "Bar chart showing aggregated views per video category",
        },
        {
            "query": "Compare average likes, comments, and shares for monetized vs non-monetized videos across regions",
            "difficulty": "Medium",
            "description": "Grouped bar chart with multiple engagement metrics",
        },
        {
            "query": "Show me the monthly trend of average sentiment score for the top 3 categories by views in 2025, and highlight which months had negative sentiment",
            "difficulty": "Complex",
            "description": "Multi-line time series chart with annotations",
        },
        {
            "query": "What is the distribution of videos across languages?",
            "difficulty": "Simple",
            "description": "Pie chart of video count by language",
        },
        {
            "query": "Which region has the highest engagement rate?",
            "difficulty": "Medium",
            "description": "Engagement rate = (likes+comments+shares)/views",
        },
        {
            "query": "Show monthly video publish trends by category for 2024",
            "difficulty": "Medium",
            "description": "Multi-line time series chart",
        },
    ]
    return SuggestionResponse(suggestions=items)


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    table_name: str = Form("custom_data"),
):
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, file.filename)
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    safe_table = table_name.replace(".csv", "").replace(" ", "_")
    schema = load_csv_to_db(filepath, safe_table)
    return {"success": True, "schema": schema, "table_name": safe_table}