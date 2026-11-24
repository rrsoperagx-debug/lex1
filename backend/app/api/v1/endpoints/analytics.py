from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.analytics_service import AnalyticsService
from app.api.deps import get_current_active_superuser
from typing import List, Dict, Any

router = APIRouter()

@router.get("/sales")
async def get_sales_analytics(
    range: str = Query("30d", regex="^(7d|30d|1y)$"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_superuser)
):
    """
    Get executive sales analytics including KPIs, charts and ROI.
    Requires Superuser (Admin) privileges.
    """
    days = 30
    if range == "7d":
        days = 7
    elif range == "1y":
        days = 365
        
    kpis = await AnalyticsService.get_sales_kpis(db)
    chart_data = await AnalyticsService.get_daily_revenue_chart(db, days=days)
    roi_data = await AnalyticsService.get_marketing_roi(db)
    category_data = await AnalyticsService.get_revenue_by_category(db)
    
    return {
        "kpis": kpis,
        "chart_data": chart_data,
        "roi_data": roi_data,
        "category_data": category_data
    }
