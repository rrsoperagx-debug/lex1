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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ExternalLink,
  Calendar,
  User,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { casesApi } from "@/services/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CasesSection: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    case_type: "cywilna",
    description: "",
  });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await casesApi.list<any>();
      setCases(data);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Podaj tytuł sprawy.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await casesApi.create<any>({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        client_name: formData.client_name.trim() || undefined,
        case_type: formData.case_type,
      });
      setCases((prev) => [created, ...prev]);
      setFormData({
        title: "",
        client_name: "",
        case_type: "cywilna",
        description: "",
      });
      setCreateOpen(false);
      toast.success("Nowa sprawa została utworzona.");
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się utworzyć sprawy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCycleStatus = async (c: any) => {
    const nextStatus =
      c.status === "open"
        ? "closed_success"
        : c.status === "closed_success"
          ? "closed"
          : "open";
    try {
      const updated = await casesApi.update<any>(c.id, { status: nextStatus });
      setCases((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, ...updated } : item)),
      );
      toast.success("Zaktualizowano status sprawy.");
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się zmienić statusu.");
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      (c.title || "").toLowerCase().includes(filter.toLowerCase()) ||
      (c.client_name || "").toLowerCase().includes(filter.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <>
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 relative overflow-hidden">
        {/* Specular highlight border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/50 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Zarządzanie Pismami i Sprawami
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {cases.length} pozycji
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monitoruj status postępowań sądowych i administracyjnych w czasie rzeczywistym.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Szukaj spraw..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 w-64 h-9 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/50 dark:border-white/10 text-xs shadow-inner"
              />
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 rounded-xl shadow-md shadow-blue-500/25 h-9 px-4 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> Nowa Sprawa
            </Button>
          </div>
        </div>

        <div className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-white/30 dark:bg-slate-900/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-200/60 dark:border-white/5">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Sprawa (Tytuł)</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Klient</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Dokumenty</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Data utworzenia</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-500">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length > 0 ? (
                    filteredCases.map((c) => (
                      <TableRow
                        key={c.id}
                        className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors border-b border-slate-100/60 dark:border-white/5 last:border-0"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{c.title}</span>
                            <span className="text-xs text-slate-500 line-clamp-1">
                              {c.description || "Brak opisu"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                              c.status === "open"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                : c.status === "closed_success"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                            }`}
                          >
                            <span className={`inline-block size-1.5 rounded-full mr-1.5 ${
                              c.status === "open"
                                ? "bg-blue-500"
                                : c.status === "closed_success"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                            }`} />
                            {c.status === "open"
                              ? "Otwarta"
                              : c.status === "closed_success"
                                ? "Wygrana"
                                : "Zakończona"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              {c.client_name || `ID: ${c.user_id?.substring(0, 8)}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {c.documents?.length || 0} pism
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(c.created_at).toLocaleDateString("pl-PL")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-panel-elevated rounded-xl">
                              <DropdownMenuLabel className="font-semibold text-xs">Działania</DropdownMenuLabel>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs"
                                onClick={() => setSelectedCase(c)}
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Otwórz sprawę
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-white/10" />
                              <DropdownMenuItem
                                className="gap-2 text-blue-600 dark:text-blue-400 font-medium cursor-pointer text-xs"
                                onClick={() => handleCycleStatus(c)}
                              >
                                Zmień status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-slate-500 italic"
                      >
                        Brak spraw do wyświetlenia.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px] glass-panel-elevated rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nowa Sprawa</DialogTitle>
            <DialogDescription>
              Utwórz nową sprawę prawną w systemie LexPortal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCase} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-title">Tytuł sprawy *</Label>
              <Input
                id="case-title"
                required
                placeholder="np. Spór o zapłatę faktury FV/2026/01"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case-client">Klient</Label>
                <Input
                  id="case-client"
                  placeholder="np. Jan Kowalski"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-type">Typ sprawy</Label>
                <select
                  id="case-type"
                  value={formData.case_type}
                  onChange={(e) =>
                    setFormData({ ...formData, case_type: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="cywilna">Cywilna</option>
                  <option value="gospodarcza">Gospodarcza</option>
                  <option value="rodzinna">Rodzinna</option>
                  <option value="pracy">Prawo pracy</option>
                  <option value="karna">Karna</option>
                  <option value="administracyjna">Administracyjna</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-desc">Opis</Label>
              <textarea
                id="case-desc"
                rows={4}
                placeholder="Krótki opis stanu faktycznego i celu postępowania..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? "Tworzenie..." : "Utwórz Sprawę"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedCase)}
        onOpenChange={(open) => !open && setSelectedCase(null)}
      >
        <DialogContent className="sm:max-w-[520px] glass-panel-elevated rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCase?.title}</DialogTitle>
            <DialogDescription>
              Szczegóły sprawy ({selectedCase?.case_type || "ogólna"})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold">Klient: </span>
              <span>{selectedCase?.client_name || selectedCase?.user_id}</span>
            </div>
            <div>
              <span className="font-semibold">Status: </span>
              <span>{selectedCase?.status}</span>
            </div>
            <div>
              <span className="font-semibold">Opis: </span>
              <p className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {selectedCase?.description || "Brak opisu."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSelectedCase(null)}>
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper for 'Plus' icon since I missed it in imports
const Plus = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
