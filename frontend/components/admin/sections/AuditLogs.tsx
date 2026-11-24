import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldAlert,
  Clock,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AuditLogsSection: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/audit/logs?page=${page}&size=10&action=${actionFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.items);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (!token) return; // Don't open WS without auth

    // WebSocket for real-time updates — token passed as query param
    // (browser WS API does not support custom headers)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/audit/ws/logs?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onerror = () => {
      // Silently ignore WS errors (e.g. no WS support in nginx yet)
    };

    ws.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data);
        // Only update real-time if filtering is clear to avoid confusing UX
        if (!actionFilter) {
          setLogs((prevLogs) => {
            if (page === 1) {
              // Add new log at the top and keep max 10 items
              return [newLog, ...prevLogs].slice(0, 10);
            }
            return prevLogs;
          });
          setTotal((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [page, actionFilter, token]);


  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>Logi Audytowe</CardTitle>
            <CardDescription>
              Pełna historia zdarzeń systemowych i aktywności administratorów.
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Filtruj akcje..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-9 w-64 bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <Clock className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Działanie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Adres IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="animate-pulse py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {log.actor_name || "System"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1 font-medium ${log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {log.status === "success" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {log.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-slate-500 italic"
                  >
                    Brak logów do wyświetlenia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-500">
            Pokazano {logs.length} z {total} zdarzeń
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 10 || loading}
            >
              Następna
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
