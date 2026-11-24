import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  History,
  Settings,
  CreditCard,
  LogOut,
  ShieldCheck,
  Scale,
  FileText,
  TrendingUp,
  Zap,
  Mail,
  MessageSquare,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";

const navMain = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    isActive: true,
    tab: "overview",
  },
  {
    title: "Klienci",
    icon: Users,
    tab: "users",
  },
  {
    title: "Sprawy i Pisma",
    icon: Briefcase,
    tab: "cases",
    badge: "12",
  },
  {
    title: "Finanse",
    icon: CreditCard,
    tab: "finance",
  },
  {
    title: "Analizy Sprzedaży",
    icon: TrendingUp,
    tab: "analytics",
  },
  {
    title: "Szablony prawne",
    icon: FileText,
    tab: "templates",
  },
  {
    title: "Poczta",
    icon: Mail,
    tab: "mail",
    badge: "5",
  },
  {
    title: "Czat",
    icon: MessageSquare,
    tab: "chat",
  },
];

const navSecondary = [
  {
    title: "Logi Systemowe",
    icon: History,
    tab: "audit",
  },
  {
    title: "Konfiguracja",
    icon: Settings,
    tab: "config",
  },
  {
    title: "Bezpieczeństwo",
    icon: ShieldCheck,
    tab: "security",
  },
  {
    title: "Optymalizator AI",
    icon: Zap,
    tab: "ai_optimizer",
  },
];

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  ...props
}: AdminSidebarProps) {
  const { logout } = useAuth();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="glass-panel border-r border-slate-200/60 dark:border-white/10 z-30 transition-all duration-300"
      {...props}
    >
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-slate-200/40 dark:border-white/5">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-white/20">
            <Scale className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-blue-700 dark:from-white dark:via-slate-200 dark:to-blue-400 bg-clip-text text-transparent">
              LexPortal
            </span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Enterprise Admin
            </span>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <Scale className="size-5" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 dark:text-slate-500 px-3">
            Menu Główne
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setActiveTab(item.tab)}
                    isActive={activeTab === item.tab}
                    className={`transition-all duration-200 rounded-xl px-3 py-2 text-sm ${
                      activeTab === item.tab
                        ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {item.icon && <item.icon className="size-4 shrink-0" />}
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 px-1.5 items-center justify-center rounded-full bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 dark:text-slate-500 px-3">
            Administracja
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setActiveTab(item.tab)}
                    isActive={activeTab === item.tab}
                    className={`transition-all duration-200 rounded-xl px-3 py-2 text-sm ${
                      activeTab === item.tab
                        ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {item.icon && <item.icon className="size-4 shrink-0" />}
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-slate-200/40 dark:border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Wyloguj"
              onClick={logout}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all px-3 py-2"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="font-medium">Wyloguj się</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
