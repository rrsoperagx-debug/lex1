import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuditLog {
  id: string;
  action: string;
  actor_name: string;
  ip_address: string;
  status: "success" | "failed";
  timestamp: string;
  details: any;
}

interface PaginatedLogs {
  items: AuditLog[];
  total: number;
  page: number;
  size: number;
}

const SecurityModule: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchLogs = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/audit/logs?page=${page}&size=10&action=${actionFilter}&status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data: PaginatedLogs = await response.json();
        setLogs(data.items);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host =
      window.location.host === "localhost:5173" ||
      window.location.host.startsWith("localhost:")
        ? "localhost:8000"
        : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/audit/ws/logs`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          // Only auto-insert if we are on the first page and no specific filters are active
          // (or if the new log matches the filters)
          setLogs((prev) => {
            const matchesAction =
              !actionFilter ||
              newLog.action.toLowerCase().includes(actionFilter.toLowerCase());
            const matchesStatus =
              !statusFilter || newLog.status === statusFilter;

            if (page === 1 && matchesAction && matchesStatus) {
              // Add new log at the top, remove last to keep size consistent
              return [newLog, ...prev.filter((l) => l.id !== newLog.id)].slice(
                0,
                10,
              );
            }
            return prev;
          });
          setTotal((prev) => prev + 1);
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [page, actionFilter, statusFilter]);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-in fade-in">
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center bg-slate-800/50 gap-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Logi
            Bezpieczeństwa
          </h3>
          <p className="text-slate-300 text-sm">
            Monitorowanie aktywności systemowej w czasie rzeczywistym.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filtruj akcję..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-full md:w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Wszystkie statusy</option>
            <option value="success">Sukces</option>
            <option value="failed">Błąd</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Ładowanie logów...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="bg-slate-900/50 uppercase text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">Data i Czas</th>
                <th className="px-6 py-4">Użytkownik</th>
                <th className="px-6 py-4">Akcja</th>
                <th className="px-6 py-4">Adres IP</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("pl-PL")}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {log.actor_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-700 px-2 py-1 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          log.status === "success"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {log.status === "success" ? "SUKCES" : "BŁĄD"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-500 italic"
                  >
                    Brak logów do wyświetlenia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-800/50">
        <p className="text-xs text-slate-500">
          Pokazano {logs.length} z {total} zdarzeń
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors text-xs"
          >
            Poprzednia
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={logs.length < 10}
            className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors text-xs"
          >
            Następna
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityModule;
