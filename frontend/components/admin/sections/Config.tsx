import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Globe,
  Shield,
  Database,
  Zap,
  Cpu,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export const ConfigSection: React.FC = () => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [appName, setAppName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [mollieKey, setMollieKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/config/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStatus(await res.json());

      const settingsRes = await fetch("/api/v1/config/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const foundAppName = settingsData.find(
          (s: any) => s.key === "app_name",
        );
        if (foundAppName) setAppName(foundAppName.value);
        else setAppName("LexPortal Premium"); // default

        const foundSupportEmail = settingsData.find(
          (s: any) => s.key === "support_email",
        );
        if (foundSupportEmail) setSupportEmail(foundSupportEmail.value);
        else setSupportEmail("support@lexportal.pl"); // default

        const foundSession = settingsData.find(
          (s: any) => s.key === "session_timeout",
        );
        if (foundSession) setSessionTimeout(foundSession.value);
        else setSessionTimeout("60");

        const foundMollie = settingsData.find(
          (s: any) => s.key === "mollie_api_key",
        );
        if (foundMollie) setMollieKey(foundMollie.value);

        const foundGemini = settingsData.find(
          (s: any) => s.key === "gemini_api_key",
        );
        if (foundGemini) setGeminiKey(foundGemini.value);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMaintenance = async (checked: boolean) => {
    try {
      setSaving(true);
      const res = await fetch("/api/v1/config/settings/maintenance_mode", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: checked ? "true" : "false" }),
      });
      if (res.ok) {
        setStatus((prev: any) => ({ ...prev, maintenance_mode: checked }));
      }
    } catch (e) {
      console.error("Error toggling maintenance mode", e);
    } finally {
      setSaving(false);
    }
  };

  const saveGeneralSettings = async () => {
    try {
      setSaving(true);
      await fetch("/api/v1/config/settings/app_name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: appName }),
      });
      await fetch("/api/v1/config/settings/support_email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: supportEmail }),
      });
      // Sukces
    } catch (e) {
      console.error("Error saving general settings", e);
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      await fetch("/api/v1/config/settings/session_timeout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: sessionTimeout }),
      });
    } catch (e) {
      console.error("Error saving security settings", e);
    } finally {
      setSaving(false);
    }
  };

  const saveIntegrationSettings = async () => {
    try {
      setSaving(true);
      if (mollieKey) {
        await fetch("/api/v1/config/settings/mollie_api_key", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value: mollieKey }),
        });
      }
      if (geminiKey) {
        await fetch("/api/v1/config/settings/gemini_api_key", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value: geminiKey }),
        });
      }
    } catch (e) {
      console.error("Error saving integration settings", e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Konfiguracja Systemu
        </h2>
        <p className="text-slate-500">
          Zarządzaj parametrami platformy, integracjami i statusami usług.
        </p>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="bg-white/50 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="status" className="gap-2">
            <Zap className="h-4 w-4" /> Status
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" /> Ogólne
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Bezpieczeństwo
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Database className="h-4 w-4" /> Integracje
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              title="Google Gemini AI"
              status={status?.ai_status || "Checking..."}
              icon={<Cpu className="h-5 w-5" />}
              description={status?.ai_model || "v1.5 Pro"}
            />
            <StatusCard
              title="PostgreSQL"
              status={status?.db_connection || "Checking..."}
              icon={<Database className="h-5 w-5" />}
              description={`${status?.db_latency_ms || 0}ms latency`}
            />
            <StatusCard
              title="Redis Cache"
              status={status?.redis_cache || "Checking..."}
              icon={<Zap className="h-5 w-5" />}
              description="Session & Rate Limit"
            />
            <StatusCard
              title="Bramka Płatności"
              status={status?.mollie_integration || "Checking..."}
              icon={<Settings className="h-5 w-5" />}
              description="PLN / Stripe-Mollie"
            />
          </div>

          <Card className="mt-6 border-none shadow-md">
            <CardHeader>
              <CardTitle>Tryb Konserwacji</CardTitle>
              <CardDescription>
                Wyłączenie dostępu dla klientów na czas prac serwisowych.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aktywuj Maintenance Mode</Label>
                <p className="text-xs text-slate-500 text-pretty">
                  Wszystkie żądania poza API Admina będą zwracać status 503.
                </p>
              </div>
              <Switch
                checked={status?.maintenance_mode || false}
                onCheckedChange={toggleMaintenance}
                disabled={saving || !status}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Główne Ustawienia</CardTitle>
              <CardDescription>
                Konfiguracja nazwy, maili i podstawowych parametrów.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="app_name">Nazwa Aplikacji</Label>
                <Input
                  id="app_name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support_email">Email Wsparcia</Label>
                <Input
                  id="support_email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-none"
                />
              </div>
              <Button
                onClick={saveGeneralSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}{" "}
                Zapisz zmiany
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Bezpieczeństwo</CardTitle>
              <CardDescription>
                Konfiguracja zabezpieczeń i sesji w panelu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="session_timeout">
                  Wygasanie sesji (minuty)
                </Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-none max-w-[200px]"
                />
              </div>
              <Button
                onClick={saveSecuritySettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}{" "}
                Zapisz bezpieczeństwo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Integracje API</CardTitle>
              <CardDescription>
                Klucze do obsługi płatności i sztucznej inteligencji.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mollie_key">Klucz Mollie API</Label>
                <Input
                  id="mollie_key"
                  type="password"
                  placeholder="test_..."
                  value={mollieKey}
                  onChange={(e) => setMollieKey(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gemini_key">Klucz Gemini API</Label>
                <Input
                  id="gemini_key"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-none"
                />
              </div>
              <Button
                onClick={saveIntegrationSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}{" "}
                Zapisz integracje
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface StatusCardProps {
  title: string;
  status: string;
  icon: React.ReactNode;
  description: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  icon,
  description,
}) => {
  const isHealthy =
    status === "healthy" || status === "active" || status === "connected";
  return (
    <Card className="border-none shadow-md bg-white/50 dark:bg-slate-900/50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
          <Badge
            variant={isHealthy ? "default" : "destructive"}
            className={
              isHealthy
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none"
                : ""
            }
          >
            {isHealthy ? "Aktywny" : status}
          </Badge>
        </div>
        <div className="mt-4">
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
