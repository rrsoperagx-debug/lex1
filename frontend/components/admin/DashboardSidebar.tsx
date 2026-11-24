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
      className="border-r border-slate-200 dark:border-slate-800"
      {...props}
    >
      <SidebarHeader className="h-16 flex items-center px-6">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Scale className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-lg tracking-tight">LexPortal</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Enterprise Admin
            </span>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <Scale className="size-6 text-blue-600" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Główne</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setActiveTab(item.tab)}
                    isActive={activeTab === item.tab}
                    className={
                      activeTab === item.tab
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : ""
                    }
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-bold text-blue-600 dark:text-blue-400">
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
          <SidebarGroupLabel>Administracja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setActiveTab(item.tab)}
                    isActive={activeTab === item.tab}
                    className={
                      activeTab === item.tab
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : ""
                    }
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Wyloguj"
              onClick={logout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut />
              <span>Wyloguj się</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
