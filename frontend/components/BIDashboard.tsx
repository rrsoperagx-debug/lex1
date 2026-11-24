import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  data: any[];
  dataKey: string;
  color: string;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  data,
  dataKey,
  color,
  icon,
}) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {icon}
        </div>
        <div
          className={`flex items-center text-sm font-medium ${isPositive ? "text-emerald-500" : "text-rose-500"} bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-full`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>

      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`gradient-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#gradient-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const RevenueChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Przychody vs Prognoza
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Analiza finansowa (PLN)
          </p>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#334155"
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                borderColor: "#334155",
                color: "#f8fafc",
              }}
              itemStyle={{ color: "#f8fafc" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Rzeczywiste"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={3}
            />
            <Area
              type="monotone"
              dataKey="date"
              name="Prognoza"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const TrafficChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Ruch i Zaangażowanie
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Odsłony vs Unikalni Użytkownicy
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#334155"
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "#334155", opacity: 0.1 }}
              contentStyle={{
                backgroundColor: "#1e293b",
                borderColor: "#334155",
                color: "#f8fafc",
              }}
            />
            <Bar
              dataKey="views"
              name="Odsłony"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="visitors"
              name="Użytkownicy"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
