from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, extract, and_
from datetime import datetime, timedelta, timezone
from app.db.models import Payment, MarketingCampaign, Case
import uuid

class AnalyticsService:
    @staticmethod
    async def get_sales_kpis(db: AsyncSession):
        now = datetime.now(timezone.utc)
        first_day_current = now.replace(day=1, hour=0, minute=0, second=0)
        
        # Calculate first day of last month correctly
        if now.month == 1:
            first_day_last = now.replace(year=now.year - 1, month=12, day=1, hour=0, minute=0, second=0)
        else:
            first_day_last = now.replace(month=now.month - 1, day=1, hour=0, minute=0, second=0)

        # Sum for current month
        current_month_query = select(func.sum(Payment.amount)).where(
            and_(Payment.status == "paid", Payment.created_at >= first_day_current)
        )
        
        # Sum for last month
        last_month_query = select(func.sum(Payment.amount)).where(
            and_(
                Payment.status == "paid", 
                Payment.created_at >= first_day_last,
                Payment.created_at < first_day_current
            )
        )

        # Total revenue ever
        total_revenue_now = (await db.execute(current_month_query)).scalar() or 0
        total_revenue_last = (await db.execute(last_month_query)).scalar() or 0
        
        growth = ((float(total_revenue_now) - float(total_revenue_last)) / float(total_revenue_last) * 100) if float(total_revenue_last) > 0 else 0
        
        # Overall totals
        total_paid_query = select(func.sum(Payment.amount)).where(Payment.status == "paid")
        total_revenue = (await db.execute(total_paid_query)).scalar() or 0
        
        transaction_count_query = select(func.count(Payment.id)).where(Payment.status == "paid")
        transaction_count = (await db.execute(transaction_count_query)).scalar() or 0
        
        avg_basket = float(total_revenue) / transaction_count if transaction_count > 0 else 0
        
        active_campaigns_query = select(func.count(MarketingCampaign.id)).where(MarketingCampaign.status == "active")
        active_campaigns = (await db.execute(active_campaigns_query)).scalar() or 0

        return {
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(total_revenue_now),
            "growth_percent": round(growth, 2),
            "transaction_count": transaction_count,
            "avg_basket": round(avg_basket, 2),
            "active_campaigns": active_campaigns
        }

    @staticmethod
    async def get_daily_revenue_chart(db: AsyncSession, days: int = 30):
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        query = (
            select(
                func.date_trunc('day', Payment.created_at).label('date'),
                func.sum(Payment.amount).label('daily_sum')
            )
            .where(and_(Payment.status == "paid", Payment.created_at >= start_date))
            .group_by(func.date_trunc('day', Payment.created_at))
            .order_by('date')
        )
        
        result = await db.execute(query)
        data = []
        for r in result:
            data.append({
                "name": r.date.strftime("%d.%m"),
                "revenue": float(r.daily_sum)
            })
        
        # Fill gaps if necessary (optional, but good for charts)
        return data

    @staticmethod
    async def get_marketing_roi(db: AsyncSession):
        query = (
            select(
                MarketingCampaign.name,
                MarketingCampaign.channel,
                MarketingCampaign.budget,
                func.sum(Payment.amount).label('generated_revenue')
            )
            .join(Payment, MarketingCampaign.id == Payment.campaign_id)
            .where(Payment.status == "paid")
            .group_by(MarketingCampaign.id)
        )
        
        result = await db.execute(query)
        return [{
            "campaign": r.name,
            "channel": r.channel.value if hasattr(r.channel, 'value') else str(r.channel),
            "cost": float(r.budget),
            "revenue": float(r.generated_revenue),
            "roi": round((float(r.generated_revenue) / float(r.budget)), 2) if r.budget > 0 else 0
        } for r in result]

    @staticmethod
    async def get_revenue_by_category(db: AsyncSession):
        # This is a sample implementation since categories might be in case type 
        # or metadata. Let's assume Case has a 'type' field or we can derive it.
        # For now, let's categorize by Case title or just mock it as requested.
        # Ideally, we should have a 'service_type' field.
        
        # Mocking for the dashboard
        return [
            {"name": "Analizy AI", "value": 45},
            {"name": "Dokumenty ZUS", "value": 35},
            {"name": "Konsultacje", "value": 20}
        ]
