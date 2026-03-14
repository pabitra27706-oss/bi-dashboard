from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000)
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)


class Annotation(BaseModel):
    type: str = "line"
    value: Optional[Union[float, str]] = None
    label: str = ""
    color: str = "#EF4444"


class ChartConfig(BaseModel):
    chart_type: str = "bar"
    title: str = ""
    x_axis: str = ""
    x_label: str = ""
    y_axis: List[str] = Field(default_factory=list)
    y_label: str = ""
    group_by: Optional[str] = None
    colors: List[str] = Field(default_factory=list)
    annotations: List[Annotation] = Field(default_factory=list)


class KPI(BaseModel):
    label: str = ""
    value: str = "N/A"
    icon: str = "bar-chart"
    trend: Optional[str] = None
    trend_direction: str = "neutral"


class QueryResponse(BaseModel):
    success: bool = True
    query: str = ""
    sql: str = ""
    data: List[Dict[str, Any]] = Field(default_factory=list)
    chart_config: Optional[ChartConfig] = None
    additional_charts: List[ChartConfig] = Field(default_factory=list)
    insight: str = ""
    kpis: List[KPI] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    execution_time: float = 0.0
    error: Optional[str] = None


class SchemaResponse(BaseModel):
    tables: List[Dict[str, Any]]
    row_count: int


class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]