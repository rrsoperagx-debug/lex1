import React, { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/DashboardSidebar";
import { Overview } from "@/components/admin/sections/Overview";
import { UsersSection } from "@/components/admin/sections/Users";
import { CasesSection } from "@/components/admin/sections/Cases";
import { AuditLogsSection } from "@/components/admin/sections/AuditLogs";
import { LegalTemplatesSection } from "@/components/admin/sections/LegalTemplates";
import { ChatSection } from "@/components/admin/sections/ChatSection";
import AIResourceOptimizer from "@/src/components/admin/AIResourceOptimizer";
import {
  Bell,
  Search,
  User,
  Database,
  Download,
  Share2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ModernAdminDashboardContent: React.FC = () => {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("month");

  const handleLogout = () => {
    logout();
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/dashboard/stats?range_type=${timeRange}`,
        {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, token]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview data={dashboardData} loading={loading} />;
      case "users":
        return <UsersSection />;
      case "cases":
        return <CasesSection />;
      case "finance":
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Finanse i Rozliczenia</h2>
            <p className="text-slate-500">
              Brak dostępnych faktur w wybranym okresie.
            </p>
          </div>
        );
      case "analytics":
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Analizy Sprzedaży</h2>
            <p className="text-slate-500">
              Zestawienia zostaną wygenerowane po zakończeniu kwartału.
            </p>
          </div>
        );
      case "mail":
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Poczta i Komunikacja</h2>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-blue-600">
                  Zapytanie od: Jan Kowalski
                </p>
                <p className="text-sm text-slate-500 italic">
                  &quot;Czy mogę prosić o aktualizację statusu sprawy?&quot;
                </p>
              </div>
              <p className="text-slate-400 text-sm">
                Przeglądasz ujednoliconą skrzynkę odbiorczą (Enterprise Mail
                v2.0).
              </p>
            </div>
          </div>
        );
      case "chat":
        return <ChatSection />;
      case "audit":
        return <AuditLogsSection />;
      case "config":
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Konfiguracja Systemu</h2>
            <p className="text-slate-500">
              Dostęp tylko dla użytkowników SuperAdmin.
            </p>
          </div>
        );
      case "security":
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Centrum Bezpieczeństwa</h2>
            <p className="text-slate-500">
              Skanowanie w poszukiwaniu luk bezpieczeństwa... OK
            </p>
          </div>
        );
      case "templates":
        return <LegalTemplatesSection />;
      case "ai_optimizer":
        return <AIResourceOptimizer data={dashboardData} loading={loading} />;
      default:
        return <Overview data={dashboardData} loading={loading} />;
    }
  };

  return (
    <div className="flex min-h-svh w-full bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden">
      {/* Premium Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse" />
      </div>

      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-6 z-20 sticky top-0 border-none shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="relative max-w-md hidden lg:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Szukaj klientów, spraw, dokumentów..."
                className="w-full bg-slate-100/50 dark:bg-slate-800/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Moje Konto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("config")}>
                  Ustawienia
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleLogout}
                >
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20 px-4"
              onClick={() => setActiveTab("cases")}
            >
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Nowe Zadanie</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full">
            <div className="flex flex-col gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Cześć, Admin 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                Witaj ponownie w panelu zarządzania LexPortal Enterprise. Masz
                dziś 3 nowe sprawy do przejrzenia.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

const ModernAdminDashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <ModernAdminDashboardContent />
    </SidebarProvider>
  );
};

export default ModernAdminDashboard;
