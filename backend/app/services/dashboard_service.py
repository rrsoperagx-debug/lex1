import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User, Case, FinanceMetric, TrafficMetric, Message, AIUsageLog
from app.schemas.dashboard import DashboardData, FinanceStats, TrafficStats, CaseAnalytics, ClientDynamics, TimePoint, AIUsageStats

class DashboardService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, range_type: str = "month") -> DashboardData:
        now = datetime.now(timezone.utc)
        if range_type == "day":
            start_date = now - timedelta(days=1)
            delta = timedelta(hours=1)
            format_str = "%H:%M"
        elif range_type == "week":
            start_date = now - timedelta(days=7)
            delta = timedelta(days=1)
            format_str = "%a"
        elif range_type == "year":
            start_date = now - timedelta(days=365)
            delta = timedelta(days=30)
            format_str = "%b"
        else: # month
            start_date = now - timedelta(days=30)
            delta = timedelta(days=1)
            format_str = "%d %b"

        # 1. Finance Stats
        finance_data = await db.execute(
            select(FinanceMetric).where(FinanceMetric.date >= start_date)
        )
        metrics = finance_data.scalars().all()
        
        actual_revenue = sum(m.revenue_actual for m in metrics)
        predicted_revenue = sum(m.revenue_predicted for m in metrics)
        costs = sum(m.costs for m in metrics)
        
        finance_chart = []
        curr = start_date
        while curr <= now:
            point_actual = sum(m.revenue_actual for m in metrics if m.date.date() == curr.date())
            finance_chart.append(TimePoint(label=curr.strftime(format_str), value=float(point_actual)))
            curr += delta

        finance = FinanceStats(
            mrr=actual_revenue, # Simplified
            actual_revenue=actual_revenue,
            predicted_revenue=predicted_revenue,
            margin=((actual_revenue - costs) / actual_revenue * 100) if actual_revenue > 0 else 0,
            profit=actual_revenue - costs,
            revenue_chart=finance_chart
        )

        # 2. Traffic Stats
        traffic_data = await db.execute(
            select(TrafficMetric).where(TrafficMetric.timestamp >= start_date)
        )
        t_metrics = traffic_data.scalars().all()
        
        traffic_chart = []
        curr = start_date
        while curr <= now:
            count = len([t for t in t_metrics if t.timestamp.date() == curr.date()])
            traffic_chart.append(TimePoint(label=curr.strftime(format_str), value=float(count)))
            curr += delta

        traffic = TrafficStats(
            total_views=len(t_metrics),
            unique_visitors=len(set(t.visitor_id for t in t_metrics if t.visitor_id)),
            engagement_rate=0.45, # Simulated
            traffic_chart=traffic_chart
        )

        # 3. Case Analytics
        cases_data = await db.execute(select(Case))
        all_cases = cases_data.scalars().all()
        
        open_cases = [c for c in all_cases if c.status == "open"]
        closed_success = [c for c in all_cases if c.status == "closed_success"]
        closed_failure = [c for c in all_cases if c.status == "closed_failure"]
        
        case_analytics = CaseAnalytics(
            total_cases=len(all_cases),
            open_cases=len(open_cases),
            closed_success=len(closed_success),
            closed_failure=len(closed_failure),
            success_rate=(len(closed_success) / (len(closed_success) + len(closed_failure)) * 100) if (len(closed_success) + len(closed_failure)) > 0 else 100,
            trend_percentage=12.5, # Simulated
            cases_chart=[] # Could add time series here too
        )

        # 4. Client Dynamics
        # Efficient SQL counting instead of fetching all objects
        new_clients_query = select(func.count(User.id)).where(
            and_(User.role == "client", User.created_at >= start_date)
        )
        new_clients_count = (await db.execute(new_clients_query)).scalar() or 0
        
        total_active_query = select(func.count(User.id)).where(
            and_(User.role == "client", User.is_active == True)
        )
        total_active_count = (await db.execute(total_active_query)).scalar() or 0
        
        clients = ClientDynamics(
            new_clients=new_clients_count,
            total_active=total_active_count,
            churn_rate=2.4, # Simulated
            retention_rate=97.6,
            growth_chart=[]
        )

        ai_data = await db.execute(select(AIUsageLog).where(AIUsageLog.timestamp >= start_date))
        ai_logs = ai_data.scalars().all()

        total_ai_requests = len(ai_logs)
        total_failovers = 0
        total_savings = 0.0
        total_time_ms = 0

        model_counts = {}
        for log in ai_logs:
            tier3_cost = (log.prompt_tokens / 1_000_000 * 1.0) + (log.completion_tokens / 1_000_000 * 3.0)
            savings = tier3_cost - float(log.cost)
            if savings > 0:
                total_savings += savings
            
            total_time_ms += log.response_time_ms
            if log.status != "success":
                total_failovers += 1
            
            m_key = f"{log.provider} ({log.model_name})"
            if m_key not in model_counts:
                model_counts[m_key] = {"name": m_key, "count": 0, "provider": log.provider}
            model_counts[m_key]["count"] += 1

        avg_time = (total_time_ms / total_ai_requests / 1000.0) if total_ai_requests > 0 else 0
        
        distribution = []
        for v in model_counts.values():
            icon = "Zap"
            color = "bg-blue-500"
            if "Mistral" in v["provider"]:
                icon = "ShieldCheck"
                color = "bg-indigo-600"
            elif "Gemini" in v["provider"]:
                icon = "Database"
                color = "bg-emerald-500"
                
            distribution.append({
                "name": v["name"],
                "count": v["count"],
                "color": color,
                "icon": icon
            })
            
        recent_log_list = []
        sorted_logs = sorted(ai_logs, key=lambda x: x.timestamp, reverse=True)[:10]
        for l in sorted_logs:
            recent_log_list.append({
                 "id": str(l.id),
                 "doc": f"Zapytanie ID: {str(l.id)[:8]}",
                 "length": l.total_tokens * 4 if l.total_tokens else l.prompt_tokens * 4,
                 "tier": "Tier 1" if "Gemini" in l.provider else "Tier 2",
                 "provider": l.provider,
                 "time": f"{l.response_time_ms / 1000.0:.2f}s",
                 "cost": f"${l.cost:.5f}"
            })
            
        ai_usage = AIUsageStats(
            total_requests=total_ai_requests,
            total_savings_usd=round(total_savings, 2),
            avg_processing_time=f"{avg_time:.2f}s",
            failover_count=total_failovers,
            model_distribution=distribution,
            recent_logs=recent_log_list
        )

        return DashboardData(
            finance=finance,
            traffic=traffic,
            cases=case_analytics,
            clients=clients,
            ai_usage=ai_usage,
            last_updated=datetime.utcnow()
        )
