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
    <div className="flex min-h-svh w-full bg-[#f8fafc] dark:bg-[#070b14] relative overflow-x-hidden transition-colors duration-300">
      {/* High-Tech Liquid Glass Ambient Refraction Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-blue-600/15 via-indigo-500/10 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-bl from-cyan-500/12 via-blue-500/8 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-tr from-purple-600/12 via-indigo-600/10 to-transparent blur-[160px]" />
      </div>

      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative z-10">
        {/* Liquid Glass Header */}
        <header className="glass-header flex h-16 shrink-0 items-center justify-between gap-4 px-6 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 opacity-40" />
            <div className="relative max-w-md hidden lg:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Szukaj klientów, spraw, dokumentacji..."
                className="w-80 h-9 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md pl-9 border border-white/40 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 text-xs shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* High-tech status indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>System AI Online</span>
            </div>

            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </Button>
            <Separator orientation="vertical" className="h-4 hidden sm:block opacity-40" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 hover:border-blue-400 transition-all shadow-sm"
                >
                  <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-panel-elevated rounded-xl">
                <DropdownMenuLabel className="font-semibold">Moje Konto</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <DropdownMenuItem onClick={() => setActiveTab("profile")} className="cursor-pointer">
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("config")} className="cursor-pointer">
                  Ustawienia
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <DropdownMenuItem
                  className="text-red-500 font-medium cursor-pointer"
                  onClick={handleLogout}
                >
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-lg shadow-blue-500/25 px-4 rounded-xl border border-white/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => setActiveTab("cases")}
            >
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline font-semibold text-xs tracking-wide">Nowa Sprawa</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full">
            <div className="flex flex-col gap-1.5 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider uppercase w-fit mb-1">
                Enterprise Dashboard 3.0
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Cześć, Admin 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-normal text-sm md:text-base">
                Platforma prawnicza LexPortal działa w trybie optymalnym. Masz dziś 3 oczekujące sprawy.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
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
