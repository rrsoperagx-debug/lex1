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
          <Card
            key={i}
            className="h-32 animate-pulse bg-slate-100 dark:bg-slate-900 border-none"
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
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Aktywne Subskrypcje",
      value: clients.total_active.toString(),
      description: "Klienci w modelu B2B i B2C",
      trend: "+4.2%",
      trendUp: true,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Nowe Sprawy",
      value: (cases.open_cases || 0).toString(),
      description: "Zlecenia w tym miesiącu",
      trend: "+8.1%",
      trendUp: true,
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Konwersja",
      value: `${(cases.success_rate || 0).toFixed(1)}%`,
      description: "Skuteczność prowadzonych spraw",
      trend: "-2.4%",
      trendUp: false,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-none shadow-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:translate-y-[-4px] transition-all duration-300 ring-1 ring-white/20 hover:ring-blue-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-wide text-slate-500/80 uppercase">
                  {kpi.title}
                </CardTitle>
                <div className={`${kpi.bg} p-2.5 rounded-xl shadow-inner`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tight">
                  {kpi.value}
                </div>
                <div className="flex items-center pt-2 text-xs font-semibold">
                  {kpi.trendUp ? (
                    <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      <span>{kpi.trend}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      <span>{kpi.trend}</span>
                    </div>
                  )}
                  <span className="ml-2 text-slate-400 font-medium">
                    {kpi.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Analiza Wzrostu</CardTitle>
              <CardDescription>
                Przychody i liczba spraw w czasie
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
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
                        stopColor="var(--color-blue-500)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-blue-500)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    strokeWidth={3}
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md">
          <CardHeader>
            <CardTitle>Rozkład Spraw</CardTitle>
            <CardDescription>Podział według kategorii prawa</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={caseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {caseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full px-4 text-xs">
              {caseDistribution.map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                  <span className="text-slate-500 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md">
          <CardHeader>
            <CardTitle>Aktywność Systemowa</CardTitle>
            <CardDescription>
              Ostatnie logi w czasie rzeczywistym
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  action: "Backup bazy danych zakończony",
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
                  className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-emerald-500" : log.status === "warning" ? "bg-amber-500" : "bg-blue-500"}`}
                    />
                    <div>
                      <p className="text-sm font-semibold">{log.user}</p>
                      <p className="text-xs text-slate-500">{log.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md">
          <CardHeader>
            <CardTitle>Podsumowanie Zespołu</CardTitle>
            <CardDescription>Obciążenie pracą prawników</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">
                      {lawyer.name}
                    </span>
                    <span className="text-slate-500">{lawyer.cases} spraw</span>
                  </div>
                  <ProgressBar
                    value={lawyer.progress}
                    color={lawyer.color as any}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
