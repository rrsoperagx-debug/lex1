import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  Zap,
  ShieldCheck,
  BarChart3,
  Clock,
  AlertTriangle,
  Database,
  Download,
  Share2,
  FileSpreadsheet,
  Cloud,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface AIOptimizerProps {
  data: any;
  loading: boolean;
}

const AIResourceOptimizer: React.FC<AIOptimizerProps> = () => {
  const { toast } = useToast();
  const { token } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/v1/admin/ai/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch AI stats", err);
        toast({
          variant: "destructive",
          title: "Błąd pobierania danych",
          description: "Nie udało się pobrać aktualnych statystyk AI.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchStats();
    }
  }, [token]);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"
          />
        ))}
      </div>
    );
  }

  const recentLogs = stats.recent_logs || [];

  const modelIcons: Record<string, React.ElementType> = {
    Database: Database,
    Zap: Zap,
    ShieldCheck: ShieldCheck,
    BarChart3: BarChart3,
  };

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
  ];
  const iconsNames = ["Zap", "Database", "ShieldCheck", "BarChart3"];

  // Convert distribution dict to array for rendering
  const modelDistribution = Object.entries(stats.distribution || {}).map(
    ([key, val], index) => ({
      name: key,
      count: val as number,
      icon: iconsNames[index % iconsNames.length],
      color: colors[index % colors.length],
    }),
  );

  const handleExportPDF = async () => {
    let allLogs = recentLogs;
    try {
      toast({
        title: "Przygotowywanie raportu",
        description: "Pobieranie pełnej historii logów z bazy...",
      });

      const response = await fetch("/api/v1/admin/ai/stats?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const fullData = await response.json();
        allLogs = fullData.recent_logs || recentLogs;
      }
    } catch (e) {
      console.error("Export failed", e);
    }

    const doc = new jsPDF();

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("LexPortal AI Audit Report", 14, 25);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 25);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Podsumowanie Optymalizacji", 14, 50);

    doc.setFontSize(10);
    doc.text(
      `Całkowite oszczędności (vs Tier 3): $${stats.total_savings.toFixed(5)}`,
      14,
      58,
    );
    doc.text(`Łączna liczba zapytań: ${stats.total_queries}`, 14, 64);
    doc.text(
      `Średnia latencja systemu: ${stats.avg_latency.toFixed(2)} ms`,
      14,
      70,
    );

    const tableData = allLogs.map((log: any) => [
      log.document_name,
      `${log.tokens_used} tk.`,
      log.model_name,
      log.provider,
      `${log.latency_ms} ms`,
      `$${log.cost_usd.toFixed(5)}`,
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [
        ["Dokument", "Zużycie", "Model", "Provider", "Czas", "Rzecz. Koszt"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
      styles: { fontSize: 8 },
    });

    doc.save(
      `Lexportal_AI_Audit_Full_${new Date().toISOString().slice(0, 10)}.pdf`,
    );

    toast({
      title: "Raport wygenerowany",
      description: "Pełny raport audit log został pomyślnie pobrany.",
    });
  };

  const handleExportDrive = async () => {
    try {
      toast({
        title: "Google Drive Export",
        description: "Generowanie raportu i przesyłanie do chmury...",
      });

      const response = await fetch("/api/v1/admin/ai/export-drive", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sukces!",
          description: `Raport '${result.filename}' został zapisany na Twoim Dysku Google.`,
          action: (
            <a
              href={result.link}
              target="_blank"
              className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold"
            >
              Otwórz
            </a>
          ),
        });
      } else {
        throw new Error("Failed to export to Drive");
      }
    } catch (e) {
      console.error("Drive export failed", e);
      toast({
        variant: "destructive",
        title: "Błąd eksportu",
        description: "Nie udało się połączyć z API Google Drive.",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Resource Optimizer
          </h2>
          <p className="text-slate-500 mt-1">
            Monitorowanie kosztów i wydajności modeli LLM (Lexportal v2.0)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Download size={18} className="text-blue-500" />
            PDF Report
          </button>
          <button
            onClick={handleExportDrive}
            aria-label="Eksportuj do Google Drive"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Cloud className="w-4 h-4 text-blue-500" /> Google Drive
          </button>
          <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 w-fit">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Orchestrator v2.0 Online
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIBox
          title="Oszczędności"
          value={`$${stats.total_savings.toFixed(5)}`}
          sub="vs. stała stawka Tier 3"
          icon={TrendingDown}
          color="text-green-600"
        />
        <KPIBox
          title="Szybkość"
          value={`${stats.avg_latency.toFixed(0)} ms`}
          sub="Średni czas odpowiedzi"
          icon={Clock}
          color="text-blue-600"
        />
        <KPIBox
          title="Zapytania"
          value={stats.total_queries.toLocaleString()}
          sub="Ostatnie 30 dni"
          icon={BarChart3}
          color="text-indigo-600"
        />
        <KPIBox
          title="Failover"
          value={stats.failover_count}
          sub="Automatyczne przełączenia"
          icon={AlertTriangle}
          color="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Model Distribution Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">
            Model Usage Distribution
          </h3>
          <div className="space-y-6">
            {modelDistribution.map((m: any) => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    {(() => {
                      const IconComp = modelIcons[m.icon] || Database;
                      return <IconComp size={16} className="text-slate-400" />;
                    })()}
                    {m.name}
                  </span>
                  <span className="text-slate-500">
                    {stats.total_queries > 0
                      ? ((m.count / stats.total_queries) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div
                    className={`${m.color} h-2.5 rounded-full`}
                    style={{
                      width: `${stats.total_queries > 0 ? (m.count / stats.total_queries) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Avg Latency
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600">
                    {stats.latency_per_provider?.[m.name] || 0} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Zoptymalizowano przez AI:</strong> Tier 1 (Gemini)
              obsłużył większość zapytań, redukując koszty operacyjne do minimum
              przy zachowaniu wysokiej wydajności.
            </p>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">
            Recent Ingestion Audit Log (v2.0)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-100">
                  <th className="pb-4 font-medium">Dokument</th>
                  <th className="pb-4 font-medium">Zużycie</th>
                  <th className="pb-4 font-medium">Model</th>
                  <th className="pb-4 font-medium">Provider</th>
                  <th className="pb-4 font-medium">Czas (ms)</th>
                  <th className="pb-4 font-medium">Koszt</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentLogs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 font-medium text-slate-700">
                      {log.document_name}
                    </td>
                    <td className="py-4 text-slate-500">
                      {log.tokens_used} tk.
                    </td>
                    <td className="py-4 text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                        {log.model_name}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`font-semibold ${log.provider === "Mistral" ? "text-indigo-600" : "text-emerald-600"}`}
                      >
                        {log.provider}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">{log.latency_ms}</td>
                    <td className="py-4 font-mono font-bold text-slate-700">
                      {`$${log.cost_usd.toFixed(5)}`}
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">
                      Brak danych w wybranym okresie
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleExportPDF}
            className="w-full mt-6 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Pobierz pełną historię audit log
          </button>
        </div>
      </div>
    </div>
  );
};

interface KPIBoxProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}

const KPIBox: React.FC<KPIBoxProps> = ({
  title,
  value,
  sub,
  icon: Icon,
  color,
}) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-center gap-4">
      <div
        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${color} group-hover:scale-110 transition-transform`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white my-1">
          {value}
        </h3>
      </div>
    </div>
    <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
      {sub}
    </p>
  </div>
);

export default AIResourceOptimizer;
