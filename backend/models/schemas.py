from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000)
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    active_table: Optional[str] = None


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
    cache_hit: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    confidence: Optional[str] = None
    assumptions: List[str] = Field(default_factory=list)
    is_modification: bool = False


class SchemaResponse(BaseModel):
    tables: List[Dict[str, Any]]
    row_count: int
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class TableInfo(BaseModel):
    name: str
    row_count: int = 0
    column_count: int = 0
    columns: List[Dict[str, str]] = Field(default_factory=list)
    is_active: bool = False


class TablesResponse(BaseModel):
    tables: List[TableInfo] = Field(default_factory=list)
    active_table: str = "youtube_data"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ActiveTableRequest(BaseModel):
    table_name: str


class UploadResponse(BaseModel):
    success: bool = True
    table_name: str = ""
    schema_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    suggested_questions: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class UploadPreviewResponse(BaseModel):
    success: bool = True
    file_name: str = ""
    file_size: int = 0
    row_count: int = 0
    columns: List[Dict[str, str]] = Field(default_factory=list)
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())