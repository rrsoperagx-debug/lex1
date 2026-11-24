import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Target,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { RevenueChart } from "../components/admin/analytics/RevenueChart";
import { MarketingROIPanel } from "../components/admin/analytics/MarketingROIPanel";
import api from "../services/api";

interface SalesData {
  kpis: {
    total_revenue: number;
    monthly_revenue: number;
    growth_percent: number;
    transaction_count: number;
    avg_basket: number;
    active_campaigns: number;
  };
  chart_data: { name: string; revenue: number }[];
  roi_data: {
    campaign: string;
    channel: string;
    cost: number;
    revenue: number;
    roi: number;
  }[];
  category_data: { name: string; value: number }[];
}

interface KPICardProps {
  title: string;
  value: number | string | undefined;
  trend?: number;
  icon: React.ElementType;
  color: string;
}

const SalesDashboard: React.FC = () => {
  const [data, setData] = useState<SalesData | null>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/analytics/sales?range=${range}`);
        setData((response as { data: any }).data);
      } catch (error) {
        console.error("Scale analytics error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const KPICard = ({
    title,
    value,
    trend,
    icon: Icon,
    color,
  }: KPICardProps) => (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}
        >
          <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-black ${trend > 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            {trend > 0 ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
        {title}
      </h3>
      <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">
        {typeof value === "number" && title.includes("Przychód")
          ? new Intl.NumberFormat("pl-PL", {
              style: "currency",
              currency: "PLN",
              maximumFractionDigits: 0,
            }).format(value)
          : value}
      </p>
    </div>
  );

  if (loading && !data) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-[32px]"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-[32px]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              Executive Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Analityka Sprzedaży
          </h1>
          <p className="text-slate-400 mt-1">
            Kompleksowy raport przychodów i efektywności marketingu
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {[
            { id: "7d", label: "7 Dni" },
            { id: "30d", label: "30 Dni" },
            { id: "1y", label: "Rok" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                range === r.id
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Rząd */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <KPICard
          title="Przychód Całkowity"
          value={data?.kpis.total_revenue}
          trend={data?.kpis.growth_percent}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <KPICard
          title="Liczba Transakcji"
          value={data?.kpis.transaction_count}
          icon={CreditCard}
          color="bg-indigo-500"
        />
        <KPICard
          title="Średni Koszyk"
          value={data?.kpis.avg_basket}
          icon={TrendingUp}
          color="bg-amber-500"
        />
        <KPICard
          title="Aktywne Kampanie"
          value={data?.kpis.active_campaigns}
          icon={Target}
          color="bg-rose-500"
        />
      </div>

      {/* Wykresy i Tabele */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RevenueChart data={data?.chart_data || []} />
        </div>
        <div className="lg:col-span-1">
          <MarketingROIPanel data={data?.roi_data || []} />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
