import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Shield,
  Bell,
  ListChecks,
  Activity,
  Cpu,
  Database,
  Server,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const settingSchema = z.record(z.string(), z.string());

interface Setting {
  key: string;
  value: string;
  description: string;
  category: string;
}

interface SystemStatus {
  ai_status: string;
  ai_model: string | null;
  db_connection: string;
  db_latency_ms: number | null;
  redis_cache: string;
  redis_latency_ms: number | null;
  mollie_integration: string;
  maintenance_mode: boolean;
  app_version: string;
  environment: string;
  base_url: string;
}

// ── Helper: status badge ──────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    healthy:        { label: "Aktywny",     cls: "bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    active:         { label: "Aktywny",     cls: "bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    connected:      { label: "Połączono",   cls: "bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    live:           { label: "LIVE",        cls: "bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    test:           { label: "Test Mode",   cls: "bg-amber-500/10  text-amber-400",    icon: <AlertCircle  className="w-3 h-3" /> },
    unavailable:    { label: "Brak",        cls: "bg-slate-500/10  text-slate-400",    icon: <XCircle      className="w-3 h-3" /> },
    error:          { label: "Błąd",        cls: "bg-red-500/10    text-red-400",      icon: <XCircle      className="w-3 h-3" /> },
    not_configured: { label: "Nieskonfig.", cls: "bg-slate-500/10  text-slate-400",    icon: <AlertCircle  className="w-3 h-3" /> },
  };
  const d = map[status] ?? { label: status, cls: "bg-slate-600 text-slate-300", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${d.cls}`}>
      {d.icon} {d.label}
    </span>
  );
};

// ── Status Card ───────────────────────────────────────────────────────
interface StatusCardProps {
  title: string;
  subtitle: string;
  status: string;
  latency?: number | null;
  iconBg: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
}
const StatusCard: React.FC<StatusCardProps> = ({ title, subtitle, status, latency, iconBg, icon, extra }) => (
  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
      <StatusBadge status={status} />
    </div>
    <div>
      <h4 className="font-bold text-white text-base">{title}</h4>
      <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
    </div>
    {latency != null && (
      <p className="text-xs text-slate-500 flex items-center gap-1">
        <Zap className="w-3 h-3 text-amber-400" /> Latencja: <span className="text-amber-400 font-mono">{latency} ms</span>
      </p>
    )}
    {extra}
  </div>
);

// ── System Status Panel ───────────────────────────────────────────────
const SystemStatusPanel: React.FC = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ latency?: number; error?: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/config/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStatus(await res.json());
    } catch (e) {
      console.error("Error fetching system status:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handlePingAI = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch("/api/v1/config/ai/ping", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") setPingResult({ latency: data.latency_ms });
      else setPingResult({ error: data.detail ?? "Błąd połączenia" });
    } catch {
      setPingResult({ error: "Błąd sieciowy" });
    } finally {
      setPinging(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Sprawdzanie stanu systemu...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Nie udało się pobrać statusu systemu.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-white">Status Systemu</h4>
          <p className="text-sm text-slate-400">
            Środowisko: <span className="text-blue-400 font-mono">{status.environment}</span>
            {" · "}v<span className="text-slate-300">{status.app_version}</span>
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Odśwież
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI */}
        <StatusCard
          title="Google Gemini AI"
          subtitle={status.ai_model ?? "Model nieskonfigurowany"}
          status={status.ai_status}
          iconBg="bg-indigo-500/10 text-indigo-400"
          icon={<Cpu className="w-5 h-5" />}
          extra={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePingAI}
                disabled={pinging || status.ai_status === "not_configured"}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                {pinging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {pinging ? "Testowanie..." : "Testuj połączenie"}
              </button>
              {pingResult && !pinging && (
                pingResult.latency != null
                  ? <span className="text-xs text-emerald-400 font-mono">✓ {pingResult.latency} ms</span>
                  : <span className="text-xs text-red-400">✗ {pingResult.error}</span>
              )}
            </div>
          }
        />

        {/* Database */}
        <StatusCard
          title="Baza Danych"
          subtitle="PostgreSQL (asyncpg)"
          status={status.db_connection}
          latency={status.db_latency_ms}
          iconBg="bg-blue-500/10 text-blue-400"
          icon={<Database className="w-5 h-5" />}
        />

        {/* Redis */}
        <StatusCard
          title="Redis Cache"
          subtitle="Sesje i rate-limiting"
          status={status.redis_cache}
          latency={status.redis_latency_ms}
          iconBg="bg-rose-500/10 text-rose-400"
          icon={<Server className="w-5 h-5" />}
        />

        {/* Mollie */}
        <StatusCard
          title="Bramka Mollie"
          subtitle="Waluta domyślna: PLN"
          status={status.mollie_integration}
          iconBg="bg-amber-500/10 text-amber-400"
          icon={<CreditCard className="w-5 h-5" />}
          extra={
            <p className="text-xs text-slate-500 font-mono truncate" title={status.base_url}>
              URL: {status.base_url}
            </p>
          }
        />
      </div>

      {/* Maintenance toggle info */}
      <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl p-4">
        <Shield className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Tryb Konserwacji</p>
          <p className="text-xs text-slate-400">
            {status.maintenance_mode
              ? "Platforma jest aktualnie w trybie konserwacji."
              : "Platforma działa normalnie. Brak zaplanowanych przerw."}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            status.maintenance_mode
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {status.maintenance_mode ? "WŁĄCZONY" : "WYŁĄCZONY"}
        </span>
      </div>
    </div>
  );
};

// ── Main ConfigModule ─────────────────────────────────────────────────
const ConfigModule: React.FC = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("status");

  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(settingSchema),
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: Setting[] = await response.json();
        setSettings(data);
        data.forEach((s) => setValue(s.key, s.value));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const updates = Object.entries(data).map(([key, value]) =>
        fetch(`/api/v1/settings/${key}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value }),
        }),
      );
      await Promise.all(updates);
      alert("Ustawienia zostały zapisane!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Błąd podczas zapisywania ustawień.");
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: "status",        label: "Status Systemu",    icon: <Activity  className="w-4 h-4" /> },
    { id: "general",       label: "Ogólne",            icon: <Globe     className="w-4 h-4" /> },
    { id: "limits",        label: "Limity Systemowe",  icon: <Shield    className="w-4 h-4" /> },
    { id: "notifications", label: "Powiadomienia",     icon: <Bell      className="w-4 h-4" /> },
    { id: "system",        label: "System",            icon: <ListChecks className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden animate-in fade-in">
      <div className="flex flex-col md:flex-row h-[640px]">
        {/* Navigation */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" /> Konfiguracja
            </h3>
          </div>
          <nav className="p-2 space-y-1 flex-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === cat.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-800">
          {/* Status tab — special rendering */}
          {activeTab === "status" ? (
            <SystemStatusPanel />
          ) : loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Ładowanie konfiguracji...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-white mb-2 underline decoration-blue-500/50 underline-offset-8">
                  {categories.find((c) => c.id === activeTab)?.label}
                </h4>
                <p className="text-sm text-slate-400">
                  Zarządzaj parametrami modułu{" "}
                  {categories.find((c) => c.id === activeTab)?.label.toLowerCase()}.
                </p>
              </div>

              <div className="space-y-6">
                {settings
                  .filter((s) => s.category === activeTab)
                  .map((setting) => (
                    <div key={setting.key} className="group">
                      <label
                        htmlFor={setting.key}
                        className="block text-sm font-bold text-slate-300 mb-1.5 group-focus-within:text-blue-400 transition-colors"
                      >
                        {setting.key.replace(/_/g, " ").toUpperCase()}
                      </label>
                      <input
                        id={setting.key}
                        type="text"
                        {...register(setting.key)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                      {setting.description && (
                        <p className="mt-1.5 text-xs text-slate-500 italic">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  ))}

                {settings.filter((s) => s.category === activeTab).length === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Brak ustawień w tej kategorii.</p>
                  </div>
                )}
              </div>

              {settings.filter((s) => s.category === activeTab).length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-700 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Zapisz Ustawienia
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigModule;
