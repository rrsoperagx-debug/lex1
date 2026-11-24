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
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Zarządzanie Pismami i Sprawami</CardTitle>
            <CardDescription>
              Monitoruj status postępowań i zarządzaj dokumentacją klientów.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Szukaj spraw..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 w-64 bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
              />
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Nowa Sprawa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableHead className="font-bold">Sprawa (Tytuł)</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Klient</TableHead>
                  <TableHead className="font-bold">Dokumenty</TableHead>
                  <TableHead className="font-bold">Data utworzenia</TableHead>
                  <TableHead className="text-right font-bold">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length > 0 ? (
                  filteredCases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{c.title}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">
                            {c.description || "Brak opisu"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            c.status === "open"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none"
                              : c.status === "closed_success"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-none"
                          }
                        >
                          {c.status === "open"
                            ? "Otwarta"
                            : c.status === "closed_success"
                              ? "Wygrana"
                              : "Zakończona"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-500" />
                          <span className="text-xs">
                            {c.client_name || `ID: ${c.user_id?.substring(0, 8)}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-500" />
                          <span className="text-xs font-medium">
                            {c.documents?.length || 0} pism
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.created_at).toLocaleDateString("pl-PL")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Działania</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => setSelectedCase(c)}
                            >
                              <ExternalLink className="h-4 w-4" /> Otwórz sprawę
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-blue-600 font-medium cursor-pointer"
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
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
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
        <DialogContent className="sm:max-w-[520px] bg-white dark:bg-slate-900">
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
