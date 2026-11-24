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
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Baza Klientów</CardTitle>
            <CardDescription>
              Zarządzaj profilami i uprawnieniami użytkowników.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Szukaj..."
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
              <UserPlus className="h-4 w-4" /> Dodaj Klienta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
                  <TableHead className="font-bold">Użytkownik</TableHead>
                  <TableHead className="font-bold">Rola</TableHead>
                  <TableHead className="font-bold">Plan</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Dołączył</TableHead>
                  <TableHead className="text-right font-bold">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-xs text-slate-500">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === "Aktywny"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none"
                              : user.status === "Zaległość"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {user.joined}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Opcje</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                toast.info(`Wybrano profil: ${user.email}`)
                              }
                            >
                              <Edit className="h-4 w-4 text-blue-500" /> Podgląd
                              profilu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                toast.info(
                                  `Link do resetu hasła wysłany na ${user.email}`,
                                )
                              }
                            >
                              <RotateCcw className="h-4 w-4 text-amber-500" />{" "}
                              Resetuj hasło
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-red-600 cursor-pointer"
                              onClick={() =>
                                toast.info(`Status użytkownika: ${user.status}`)
                              }
                            >
                              <Trash2 className="h-4 w-4" /> Zarchiwizuj
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
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-900">
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
