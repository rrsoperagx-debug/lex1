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
  UserPlus,
  Edit,
  RotateCcw,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usersApi, AdminUserResponse } from "@/services/api";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  joined: string;
}

const ROLE_LABELS: Record<string, string> = {
  client: "Klient",
  lawyer: "Prawnik",
  operator: "Operator Prawny",
  admin: "Administrator",
};

const mapApiUser = (u: AdminUserResponse): UserRow => ({
  id: u.id,
  name: u.full_name || u.email.split("@")[0],
  email: u.email,
  role: ROLE_LABELS[(u.role || "client").toLowerCase()] || u.role,
  plan: (u.role || "").toLowerCase() === "client" ? "Standard" : "-",
  status: u.is_active ? "Aktywny" : "Zablokowany",
  joined: new Date(u.created_at).toLocaleDateString("pl-PL"),
});

export const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "client",
    password: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data.map(mapApiUser));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Nie udało się pobrać listy klientów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      toast.error("Podaj adres email oraz hasło.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await usersApi.create({
        full_name: formData.full_name.trim() || undefined,
        email: formData.email.trim(),
        role: formData.role,
        password: formData.password,
      });
      setUsers((prev) => [mapApiUser(created), ...prev]);
      setFormData({
        full_name: "",
        email: "",
        role: "client",
        password: "",
      });
      setCreateOpen(false);
      toast.success("Klient został dodany do bazy.");
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się dodać klienta.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase()),
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
                Baza Użytkowników i Klientów
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {users.length} kont
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Zarządzaj profilami, uprawnieniami RBAC oraz subskrypcjami użytkowników.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Szukaj klientów..."
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
              <UserPlus className="h-3.5 w-3.5" /> Dodaj Klienta
            </Button>
          </div>
        </div>

        <div className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Użytkownik</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Rola</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Plan</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Dołączył</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-500">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors border-b border-slate-100/60 dark:border-white/5 last:border-0"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
                            <span className="text-xs text-slate-500">
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs rounded-full border-slate-300 dark:border-slate-700">
                            {user.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                              user.status === "Aktywny"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : user.status === "Zaległość"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}
                          >
                            <span className={`inline-block size-1.5 rounded-full mr-1.5 ${
                              user.status === "Aktywny"
                                ? "bg-emerald-500"
                                : user.status === "Zaległość"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`} />
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-mono">
                          {user.joined}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-panel-elevated rounded-xl">
                              <DropdownMenuLabel className="font-semibold text-xs">Opcje</DropdownMenuLabel>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs"
                                onClick={() =>
                                  toast.info(`Wybrano profil: ${user.email}`)
                                }
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-500" /> Podgląd profilu
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs"
                                onClick={() =>
                                  toast.info(
                                    `Link do resetu hasła wysłany na ${user.email}`,
                                  )
                                }
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-amber-500" /> Resetuj hasło
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-white/10" />
                              <DropdownMenuItem
                                className="gap-2 text-red-500 font-medium cursor-pointer text-xs"
                                onClick={() =>
                                  toast.info(`Status użytkownika: ${user.status}`)
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Zarchiwizuj
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
                        Brak użytkowników do wyświetlenia.
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
        <DialogContent className="sm:max-w-[480px] glass-panel-elevated rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dodaj Klienta</DialogTitle>
            <DialogDescription>
              Utwórz nowe konto klienta lub członka zespołu w LexPortal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Imię i nazwisko / Nazwa firmy</Label>
              <Input
                id="client-name"
                placeholder="np. Jan Kowalski"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Adres email *</Label>
              <Input
                id="client-email"
                type="email"
                required
                placeholder="np. klient@firma.pl"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-role">Rola</Label>
              <select
                id="client-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="client">Klient</option>
                <option value="lawyer">Prawnik</option>
                <option value="operator">Operator Prawny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password">Hasło tymczasowe *</Label>
              <Input
                id="client-password"
                type="password"
                required
                placeholder="Min. 8 znaków (duża, mała litera, cyfra, znak spec.)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">
                Wymagane: min. 8 znaków, wielka i mała litera, cyfra oraz znak
                specjalny (np. `!@#$`).
              </p>
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
                {submitting ? "Dodawanie..." : "Dodaj Klienta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
