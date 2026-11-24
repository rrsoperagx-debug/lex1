import React, { useState, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/DashboardSidebar";
import { Overview } from "@/components/admin/sections/Overview";
import { UsersSection } from "@/components/admin/sections/Users";
import { CasesSection } from "@/components/admin/sections/Cases";
import { AuditLogsSection } from "@/components/admin/sections/AuditLogs";
import { ConfigSection } from "@/components/admin/sections/Config";
import { LegalTemplatesSection } from "@/components/admin/sections/LegalTemplates";
import { Bell, Search, User, Settings, HelpCircle, Plus } from "lucide-react";
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

const ModernAdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("month");

  const fetchDashboardData = async () => {
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
      case "audit":
        return <AuditLogsSection />;
      case "configuration":
        return <ConfigSection />;
      case "templates":
        return <LegalTemplatesSection />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/30 dark:bg-slate-900/30">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Moduł {activeTab} w budowie
            </h2>
            <p className="text-slate-500 max-w-sm text-center">
              Implementujemy właśnie ten moduł z wykorzystaniem najnowszych
              wzorców enterprise.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setActiveTab("overview")}
            >
              Wróć do Przeglądu
            </Button>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SidebarInset className="bg-slate-50/50 dark:bg-slate-950/50">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <div className="relative max-w-md hidden md:block">
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
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Moje Konto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Ustawienia</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4" /> Nowe Zadanie
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Cześć, Admin 👋
              </h1>
              <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-1">
                Panel Zarządzania E-Kancelarią
              </p>
            </div>
            {activeTab === "overview" && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {["day", "week", "month", "year"].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={
                      timeRange === range
                        ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  >
                    {range === "day"
                      ? "Dzień"
                      : range === "week"
                        ? "Tydzień"
                        : range === "month"
                          ? "Miesiąc"
                          : "Rok"}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ModernAdminDashboard;
