import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Briefcase,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ProgressBar } from "@tremor/react";
import { motion } from "framer-motion";

interface OverviewProps {
  data: any;
  loading: boolean;
}

const chartConfig = {
  revenue: {
    label: "Przychód",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Użytkownicy",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const Overview: React.FC<OverviewProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl glass-panel animate-pulse"
          />
        ))}
      </div>
    );
  }

  const { finance, traffic, cases, clients } = data;

  const kpiData = [
    {
      title: "Przychód Całkowity",
      value: `${finance.actual_revenue.toLocaleString("pl-PL")} PLN`,
      description: "Suma wpłat (Subskrypcje + Jednorazowe)",
      trend: "+12.5%",
      trendUp: true,
      icon: CreditCard,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/15 border border-blue-500/30",
      glow: "from-blue-500/20 to-indigo-500/0",
    },
    {
      title: "Aktywne Subskrypcje",
      value: clients.total_active.toString(),
      description: "Klienci w modelu B2B i B2C",
      trend: "+4.2%",
      trendUp: true,
      icon: Users,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/15 border border-purple-500/30",
      glow: "from-purple-500/20 to-pink-500/0",
    },
    {
      title: "Nowe Sprawy",
      value: (cases.open_cases || 0).toString(),
      description: "Zlecenia w tym miesiącu",
      trend: "+8.1%",
      trendUp: true,
      icon: Briefcase,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/15 border border-emerald-500/30",
      glow: "from-emerald-500/20 to-teal-500/0",
    },
    {
      title: "Konwersja",
      value: `${(cases.success_rate || 0).toFixed(1)}%`,
      description: "Skuteczność prowadzonych spraw",
      trend: "-2.4%",
      trendUp: false,
      icon: Activity,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/15 border border-amber-500/30",
      glow: "from-amber-500/20 to-orange-500/0",
    },
  ];

  const caseDistribution = [
    { name: "Prawo Pracy", value: 35, color: "#3b82f6" },
    { name: "Rozwody", value: 20, color: "#8b5cf6" },
    { name: "Obsługa Spółek", value: 30, color: "#10b981" },
    { name: "Inne", value: 15, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 border border-white/60 dark:border-white/10">
              {/* Specular highlight border */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />
              {/* Subtle ambient corner glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${kpi.glow} blur-2xl rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  {kpi.title}
                </span>
                <div className={`${kpi.bg} p-2.5 rounded-xl shadow-sm backdrop-blur-md`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {kpi.value}
                </div>
                <div className="flex items-center pt-2 text-xs font-semibold">
                  {kpi.trendUp ? (
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      <span>{kpi.trend}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      <span>{kpi.trend}</span>
                    </div>
                  )}
                  <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-[11px] truncate">
                    {kpi.description}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />
          <div className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Analiza Wzrostu</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Przychody i liczba spraw w czasie rzeczywistym
              </p>
            </div>
          </div>
          <div className="pl-0 pt-2">
            <ChartContainer
              config={chartConfig}
              className="aspect-square md:aspect-auto md:h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={finance.revenue_chart}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    strokeWidth={2.5}
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel rounded-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />
          <div className="space-y-1 pb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Rozkład Spraw</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Podział według kategorii prawa</p>
          </div>
          <div className="flex flex-col items-center justify-center h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={caseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {caseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2 w-full pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs">
            {caseDistribution.map((item, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {item.name}
                </span>
                <span className="text-slate-500 ml-auto font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />
          <div className="space-y-1 pb-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Aktywność Systemowa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ostatnie logi zdarzeń w czasie rzeczywistym
            </p>
          </div>
          <div className="space-y-3.5">
            {[
              {
                user: "Admin",
                action: "Zaktualizowano cennik",
                time: "2 min temu",
                status: "success",
              },
              {
                user: "Klient (B2B)",
                action: "Nowe zamówienie: Pismo procesowe",
                time: "5 min temu",
                status: "info",
              },
              {
                user: "System",
                action: "Kopia zapasowa bazy danych zakończona sukcesem",
                time: "1 godz. temu",
                status: "success",
              },
              {
                user: "Klient (B2C)",
                action: "Rejestracja nowego użytkownika",
                time: "2 godz. temu",
                status: "info",
              },
              {
                user: "Admin",
                action: "Zmiana statusu sprawy #1024",
                time: "3 godz. temu",
                status: "warning",
              },
            ].map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors border-b border-slate-100/60 dark:border-white/5 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      log.status === "success"
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : log.status === "warning"
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.user}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{log.action}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel rounded-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />
          <div className="space-y-1 pb-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Podsumowanie Zespołu</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Obciążenie bieżącymi sprawami</p>
          </div>
          <div className="space-y-5">
            {[
              {
                name: "Mec. Anna Nowak",
                cases: 24,
                progress: 85,
                color: "blue",
              },
              {
                name: "Mec. Piotr Wiśniewski",
                cases: 18,
                progress: 60,
                color: "purple",
              },
              {
                name: "Mec. Maria Lewandowska",
                cases: 32,
                progress: 95,
                color: "emerald",
              },
              {
                name: "Mec. Jan Kowalski",
                cases: 12,
                progress: 40,
                color: "amber",
              },
            ].map((lawyer, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">
                    {lawyer.name}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">{lawyer.cases} spraw</span>
                </div>
                <ProgressBar
                  value={lawyer.progress}
                  color={lawyer.color as any}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
