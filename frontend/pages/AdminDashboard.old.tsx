import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  Activity,
  ShieldAlert,
  Globe,
  Megaphone,
  Search,
  CheckCircle,
  FileText,
  Menu,
  X,
  Trash2,
  Edit,
  RotateCcw,
  Download,
  Plus,
  UserPlus,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import SecurityModule from "../components/SecurityModule";
import ConfigModule from "../components/ConfigModule";
import {
  MetricCard,
  RevenueChart,
  TrafficChart,
} from "../components/BIDashboard";
import { DashboardSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { NewCampaignModal } from "../components/admin/marketing/NewCampaignModal";
import { marketingApi } from "../services/marketing";

// --- MOCK DATA FOR LISTS (Keeping these for now as they are not yet in the BI API) ---
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  joined: string;
  lastLogin: string;
}

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Kancelaria Prawna Omega",
    email: "biuro@omega-legal.pl",
    role: "Firma (B2B)",
    plan: "Subskrypcja PRO",
    status: "Aktywny",
    joined: "2023-01-15",
    lastLogin: "2 min temu",
  },
  {
    id: 2,
    name: "Jan Kowalski",
    email: "jan.k@gmail.com",
    role: "Klient Ind.",
    plan: "Standard",
    status: "Aktywny",
    joined: "2023-05-20",
    lastLogin: "1 dzień temu",
  },
  {
    id: 3,
    name: "Anna Nowak (Mec.)",
    email: "anna.nowak@lexportal.pl",
    role: "Operator Prawny",
    plan: "-",
    status: "Aktywny",
    joined: "2022-11-01",
    lastLogin: "Teraz",
  },
  {
    id: 4,
    name: "Startup Sp. z o.o.",
    email: "kontakt@startup.io",
    role: "Firma (B2B)",
    plan: "Subskrypcja",
    status: "Zaległość",
    joined: "2023-08-10",
    lastLogin: "5 dni temu",
  },
  {
    id: 5,
    name: "Piotr Wiśniewski",
    email: "p.wisniewski@onet.pl",
    role: "Klient Ind.",
    plan: "Standard",
    status: "Zablokowany",
    joined: "2023-09-01",
    lastLogin: "30 dni temu",
  },
  {
    id: 6,
    name: "Maria Lewandowska",
    email: "m.lewandowska@wp.pl",
    role: "Klient Ind.",
    plan: "Standard",
    status: "Aktywny",
    joined: "2023-11-02",
    lastLogin: "3 godz. temu",
  },
];

const INITIAL_INVOICES = [
  {
    id: "FV/23/11/1050",
    client: "Kancelaria Omega",
    nip: "525-000-11-22",
    amount: "499.00 PLN",
    date: "2023-11-15",
    status: "Opłacona",
    method: "Stripe",
  },
  {
    id: "FV/23/11/1049",
    client: "Jan Kowalski",
    nip: "-",
    amount: "49.00 PLN",
    date: "2023-11-14",
    status: "Opłacona",
    method: "BLIK",
  },
  {
    id: "FV/23/11/1048",
    client: "Startup Sp. z o.o.",
    nip: "123-456-78-90",
    amount: "199.00 PLN",
    date: "2023-11-12",
    status: "Oczekuje",
    method: "Przelew",
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, invoices, marketing, security
  const [timeRange, setTimeRange] = useState("month"); // day, week, month, year
  const [loading, setLoading] = useState(false);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<Record<
    string,
    any
  > | null>(null);

  // Users State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [userFilter, setUserFilter] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Klient Ind.",
    plan: "Standard",
  });

  // Invoices State
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    client: "",
    nip: "",
    amount: "",
    method: "Przelew",
    status: "Oczekuje",
  });

  // Marketing State
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/dashboard/stats?range_type=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, token]);

  const fetchCampaigns = React.useCallback(async () => {
    try {
      const data = await marketingApi.listCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchCampaigns();

    // WebSocket Connection
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/api/v1/admin/dashboard/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.finance) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [fetchDashboardData, fetchCampaigns]);

  // --- ACTIONS ---

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- USER ACTIONS ---
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      role: "Klient Ind.",
      plan: "Standard",
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...userFormData } : u,
        ),
      );
    } else {
      const newUser: User = {
        id: Date.now(),
        ...userFormData,
        status: "Aktywny",
        joined: "Teraz",
        lastLogin: "-",
      };
      setUsers([...users, newUser]);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm("Czy na pewno chcesz zarchiwizować tego użytkownika?")) {
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, status: "Zarchiwizowany" } : u,
        ),
      );
    }
  };

  const handleRestoreUser = (id: number) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: "Aktywny" } : u)));
  };

  // --- INVOICE ACTIONS ---
  const handleOpenInvoiceModal = () => {
    setInvoiceFormData({
      client: "",
      nip: "",
      amount: "",
      method: "Przelew",
      status: "Oczekuje",
    });
    setShowInvoiceModal(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv = {
      id: `FV/23/11/${1050 + invoices.length + 1}`,
      date: new Date().toLocaleDateString(),
      ...invoiceFormData,
    };
    setInvoices([newInv, ...invoices]);
    setShowInvoiceModal(false);
  };

  const handleAddCampaign = () => {
    setShowCampaignModal(true);
  };

  // --- RENDER FUNCTIONS ---

  const renderOverview = () => {
    if (loading && !dashboardData) {
      return <DashboardSkeleton />;
    }

    if (!dashboardData) return null;

    return (
      <div className="space-y-6 animate-in fade-in cursor-default">
        {/* Time Range Filter */}
        <div className="flex justify-end mb-4">
          <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-lg inline-flex">
            {["day", "week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {range === "day"
                  ? "Dzień"
                  : range === "week"
                    ? "Tydzień"
                    : range === "month"
                      ? "Miesiąc"
                      : "Rok"}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Przychód (MRR)"
            value={`${dashboardData.finance.actual_revenue.toLocaleString("pl-PL")} PLN`}
            trend={12.5}
            data={dashboardData.finance.revenue_chart}
            dataKey="value"
            color="#3b82f6"
            icon={<CreditCard className="w-6 h-6 text-blue-500" />}
          />
          <MetricCard
            title="Nowi Klienci"
            value={dashboardData.clients.new_clients.toString()}
            trend={8.2}
            data={dashboardData.traffic.traffic_chart} // Using traffic chart as proxy for sparkline for now
            dataKey="value"
            color="#8b5cf6"
            icon={<UserPlus className="w-6 h-6 text-purple-500" />}
          />
          <MetricCard
            title="Wskaźnik Sukcesu"
            value={`${dashboardData.cases.success_rate.toFixed(1)}%`}
            trend={5.4}
            data={dashboardData.finance.revenue_chart} // Placeholder data
            dataKey="value"
            color="#10b981"
            icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
          />
          <MetricCard
            title="Ruch (Odsłony)"
            value={dashboardData.traffic.total_views.toLocaleString("pl-PL")}
            trend={-2.1}
            data={dashboardData.traffic.traffic_chart}
            dataKey="value"
            color="#f59e0b"
            icon={<Activity className="w-6 h-6 text-amber-500" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart data={dashboardData.finance.revenue_chart} />
          <TrafficChart data={dashboardData.traffic.traffic_chart} />
        </div>

        {/* Bottom Section - Case Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Efektywność Spraw
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Otwarte Sprawy
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {dashboardData.cases.open_cases}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Wygrane
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {dashboardData.cases.closed_success}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Przegrane/Ugodzone
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {dashboardData.cases.closed_failure}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Łącznie Spraw
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {dashboardData.cases.total_cases}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-in fade-in">
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center bg-slate-800/50 gap-4">
        <div>
          <h3 className="font-bold text-white text-lg">Baza Użytkowników</h3>
          <p className="text-slate-300 text-sm">
            Zarządzaj dostępem klientów i operatorów.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Szukaj (Email, Nazwa, NIP)..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          <button
            onClick={openAddUserModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Dodaj użytkownika
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900/50 uppercase text-xs font-semibold text-slate-400">
            <tr>
              <th className="px-6 py-4">Użytkownik</th>
              <th className="px-6 py-4">Rola</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users
              .filter(
                (u) =>
                  u.name.toLowerCase().includes(userFilter.toLowerCase()) ||
                  u.email.includes(userFilter),
              )
              .map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-slate-700/30 transition-colors ${u.status === "Zarchiwizowany" ? "opacity-50" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div
                      className={`font-medium text-white ${u.status === "Zarchiwizowany" && "line-through"}`}
                    >
                      {u.name}
                    </div>
                    <div className="text-xs">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-700 px-2 py-1 rounded text-xs text-white">
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        u.status === "Aktywny"
                          ? "bg-green-500/10 text-green-400"
                          : u.status === "Zaległość"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : u.status === "Zarchiwizowany"
                              ? "bg-slate-700 text-slate-500"
                              : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openEditUserModal(u)}
                      className="p-1.5 hover:bg-slate-600 rounded text-blue-400"
                      title="Edytuj"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.status === "Zarchiwizowany" ? (
                      <button
                        onClick={() => handleRestoreUser(u.id)}
                        className="p-1.5 hover:bg-slate-600 rounded text-green-400"
                        title="Przywróć"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 hover:bg-slate-600 rounded text-amber-400"
                        title="Zarchiwizuj"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-in fade-in">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <div>
          <h3 className="font-bold text-white text-lg">Rejestr Faktur</h3>
          <p className="text-slate-300 text-sm">
            Historia płatności i dokumenty sprzedażowe.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenInvoiceModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Generuj
          </button>
          <button
            onClick={() => {}}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Eksportuj CSV
          </button>
        </div>
      </div>
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="bg-slate-900/50 uppercase text-xs font-semibold text-slate-400">
          <tr>
            <th className="px-6 py-4">Numer Faktury</th>
            <th className="px-6 py-4">Klient</th>
            <th className="px-6 py-4">Kwota Brutto</th>
            <th className="px-6 py-4">Metoda</th>
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Pobierz</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="hover:bg-slate-700/30 transition-colors"
            >
              <td className="px-6 py-4 font-mono text-white">{inv.id}</td>
              <td className="px-6 py-4">
                <div className="text-white">{inv.client}</div>
                <div className="text-xs">NIP: {inv.nip}</div>
              </td>
              <td className="px-6 py-4 font-bold text-white">{inv.amount}</td>
              <td className="px-6 py-4">{inv.method}</td>
              <td className="px-6 py-4">{inv.date}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    inv.status === "Opłacona"
                      ? "bg-green-500/10 text-green-400"
                      : inv.status === "Oczekuje"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-blue-400 hover:text-blue-300">
                  <Download className="w-4 h-4 ml-auto" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="bg-blue-900/50 w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30">
            <Globe className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-bold text-white mb-2">E-E-A-T Strategy</h3>
          <p className="text-sm text-slate-300 mb-2">
            Experience, Expertise, Authoritativeness, Trustworthiness.
          </p>
        </div>
        {/* ... other strategy cards ... */}
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">
            Aktywne Kampanie Marketingowe
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddCampaign}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> Nowa Kampania
            </button>
          </div>
        </div>
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900/50 uppercase text-xs font-semibold text-slate-400">
            <tr>
              <th className="px-6 py-4">Nazwa Kampanii</th>
              <th className="px-6 py-4">Kanał</th>
              <th className="px-6 py-4">Budżet</th>
              <th className="px-6 py-4">Cel</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-slate-500 italic"
                >
                  Brak aktywnych kampanii. Stwórz swoją pierwszą kampanię z AI!
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => (
                <tr
                  key={camp.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {camp.name}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {camp.channel.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4">
                    {camp.budget} {camp.currency || "PLN"}
                  </td>
                  <td className="px-6 py-4 text-xs max-w-[200px] truncate">
                    {camp.goal}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {camp.created_at
                      ? new Date(camp.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${camp.status === "active" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}
                    >
                      {camp.status === "active" ? "Aktywna" : "Wersja robocza"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-900">
          {sidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-white">
              LexAdmin <span className="text-blue-500">Pro</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {[
            {
              id: "overview",
              label: "Przegląd",
              icon: <LayoutDashboard className="w-5 h-5" />,
            },
            {
              id: "users",
              label: "Użytkownicy",
              icon: <Users className="w-5 h-5" />,
            },
            {
              id: "cases",
              label: "Sprawy",
              icon: <FileText className="w-5 h-5" />,
            },
            {
              id: "invoices",
              label: "Finanse",
              icon: <CreditCard className="w-5 h-5" />,
            },
            {
              id: "marketing",
              label: "Marketing",
              icon: <Megaphone className="w-5 h-5" />,
            },
            {
              id: "security",
              label: "Audyt & Bezp.",
              icon: <ShieldAlert className="w-5 h-5" />,
            },
            {
              id: "config",
              label: "Konfiguracja",
              icon: <Settings className="w-5 h-5" />,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Wyloguj</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900">
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white capitalize">
              {activeTab === "overview" && "Panel Główny"}
              {activeTab === "users" && "Zarządzanie Użytkownikami"}
              {activeTab === "invoices" && "Finanse i Faktury"}
              {activeTab === "marketing" && "Centrum Marketingu"}
              {activeTab === "cases" && "Rejestr Spraw"}
              {activeTab === "security" && "Logi Bezpieczeństwa"}
              {activeTab === "config" && "Ustawienia Systemu"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Szukaj w panelu..."
                className="bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-800"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "invoices" && renderInvoices()}
            {activeTab === "marketing" && renderMarketing()}
            {activeTab === "cases" && (
              <div className="text-center py-20 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-400">
                  Moduł Spraw
                </h3>
                <p>Aby zarządzać sprawami, przejdź do Panelu Prawnika.</p>
              </div>
            )}
            {activeTab === "security" && <SecurityModule />}
            {activeTab === "config" && <ConfigModule />}
            {/* Add placeholders for other tabs if needed */}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? "Edytuj użytkownika" : "Nowy użytkownik"}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Imię i Nazwisko / Nazwa
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="user-role"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Rola
                </label>
                <select
                  id="user-role"
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, role: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option>Klient Ind.</option>
                  <option>Firma (B2B)</option>
                  <option>Operator Prawny</option>
                  <option>Administrator</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="user-plan"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Plan
                </label>
                <select
                  id="user-plan"
                  value={userFormData.plan}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, plan: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option>Standard</option>
                  <option>Subskrypcja</option>
                  <option>Subskrypcja PRO</option>
                  <option>-</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Nowa Faktura</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Klient
                </label>
                <input
                  type="text"
                  required
                  value={invoiceFormData.client}
                  onChange={(e) =>
                    setInvoiceFormData({
                      ...invoiceFormData,
                      client: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={invoiceFormData.nip}
                  onChange={(e) =>
                    setInvoiceFormData({
                      ...invoiceFormData,
                      nip: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Kwota
                </label>
                <input
                  type="text"
                  required
                  value={invoiceFormData.amount}
                  onChange={(e) =>
                    setInvoiceFormData({
                      ...invoiceFormData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Wystaw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CAMPAIGN MODAL */}
      <NewCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onCampaignCreated={fetchCampaigns}
      />
    </div>
  );
};

export default AdminDashboard;
