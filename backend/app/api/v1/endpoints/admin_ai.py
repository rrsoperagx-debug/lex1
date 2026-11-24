import uuid
from datetime import datetime, timedelta
from typing import Any, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_db, get_current_active_superuser
from app.db.models import AIUsageLog

router = APIRouter()

@router.get("/stats")
async def get_ai_stats(
    all: bool = False,
    db: AsyncSession = Depends(get_db),
    # Require superuser privileges
    current_superuser: Any = Depends(get_current_active_superuser)
) -> dict:
    # 30 days window
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # 1. Total tokens and cost for savings calculation
    # Formula: (tokens_used * 0.000015) - cost_usd
    query_usage = select(func.sum(AIUsageLog.total_tokens), func.sum(AIUsageLog.cost)).where(AIUsageLog.timestamp >= thirty_days_ago)
    res_usage = await db.execute(query_usage)
    row_usage = res_usage.first()
    total_tokens = row_usage[0] or 0
    total_cost = float(row_usage[1] or 0.0)
    
    tier3_baseline = total_tokens * 0.000015
    total_savings = max(0, tier3_baseline - total_cost)
    
    # 2. Avg latency & total queries
    query_stats = select(func.avg(AIUsageLog.response_time_ms), func.count(AIUsageLog.id)).where(AIUsageLog.timestamp >= thirty_days_ago)
    res_stats = await db.execute(query_stats)
    row_stats = res_stats.first()
    avg_latency = float(row_stats[0] or 0.0)
    total_queries = row_stats[1] or 0
    
    # 3. Failover count
    # Status "failover" indicates a fallback was triggered
    query_failover = select(func.count(AIUsageLog.id)).where(
        AIUsageLog.timestamp >= thirty_days_ago,
        AIUsageLog.status == "failover"
    )
    res_failover = await db.execute(query_failover)
    failover_count = res_failover.scalar() or 0
    
    # 4. Distribution and Avg Latency by provider
    query_dist = select(
        AIUsageLog.provider, 
        func.count(), 
        func.avg(AIUsageLog.response_time_ms)
    ).where(AIUsageLog.timestamp >= thirty_days_ago).group_by(AIUsageLog.provider)
    
    res_dist = await db.execute(query_dist)
    dist_results = res_dist.all()
    
    distribution = {}
    latency_per_provider = {}
    for provider, count, avg_lat in dist_results:
        distribution[provider] = count
        latency_per_provider[provider] = round(float(avg_lat or 0.0), 2)
        
    # 5. Logs (all or 10)
    query_recent = select(AIUsageLog).order_by(AIUsageLog.timestamp.desc())
    if not all:
        query_recent = query_recent.limit(10)
        
    res_recent = await db.execute(query_recent)
    logs = res_recent.scalars().all()
    
    recent_logs = []
    for log in logs:
        recent_logs.append({
            "id": str(log.id),
            "document_name": f"Document {str(log.id)[:8]}",
            "tokens_used": log.total_tokens,
            "provider": log.provider,
            "model_name": log.model_name,
            "latency_ms": log.response_time_ms,
            "cost_usd": float(log.cost),
            "timestamp": log.timestamp.isoformat()
        })

    return {
        "total_savings": round(total_savings, 5),
        "total_cost": round(total_cost, 5),
        "avg_latency": round(avg_latency, 2),
        "total_queries": total_queries,
        "failover_count": failover_count,
        "distribution": distribution,
        "latency_per_provider": latency_per_provider,
        "recent_logs": recent_logs
    }
