from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class TimePoint(BaseModel):
    label: str  # e.g., "10:00", "Pn", "Sty"
    value: float
    secondary_value: Optional[float] = None

class FinanceStats(BaseModel):
    mrr: float
    actual_revenue: float
    predicted_revenue: float
    margin: float
    profit: float
    revenue_chart: List[TimePoint]

class TrafficStats(BaseModel):
    total_views: int
    unique_visitors: int
    engagement_rate: float
    traffic_chart: List[TimePoint]

class CaseAnalytics(BaseModel):
    total_cases: int
    open_cases: int
    closed_success: int
    closed_failure: int
    success_rate: float
    trend_percentage: float
    cases_chart: List[TimePoint]

class ClientDynamics(BaseModel):
    new_clients: int
    total_active: int
    churn_rate: float
    retention_rate: float
    growth_chart: List[TimePoint]

class AIUsageStats(BaseModel):
    total_requests: int
    total_savings_usd: float
    avg_processing_time: str
    failover_count: int
    model_distribution: List[Dict[str, Any]]
    recent_logs: List[Dict[str, Any]]

class DashboardData(BaseModel):
    finance: FinanceStats
    traffic: TrafficStats
    cases: CaseAnalytics
    clients: ClientDynamics
    ai_usage: Optional[AIUsageStats] = None
    last_updated: datetime
