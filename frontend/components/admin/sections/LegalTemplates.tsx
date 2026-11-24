import React, { useState } from "react";
import {
  Link,
  DownloadCloud,
  Plus,
  Eye,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { legalTemplatesApi } from "@/services/api";
import { TemplateReviewer } from "./TemplateReviewer";

export const LegalTemplatesSection: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedTemplate, setParsedTemplate] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScraping(true);
    setParsedTemplate(null);
    try {
      const resData = await legalTemplatesApi.scrape(url);

      if (resData.status === "success") {
        setParsedTemplate(resData.data);
        toast({
          title: "Pobieranie zakończone",
          description: "Model AI poprawnie wyodrębnił dane z szablonu.",
          variant: "default",
        });
      } else {
        throw new Error("Błąd podczas scrapowania");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się pobrać szablonu.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async () => {
    if (!parsedTemplate) return;
    setIsSaving(true);

    try {
      const dbPayload = {
        title: parsedTemplate.title,
        custom_id: parsedTemplate.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .slice(0, 50),
        category: parsedTemplate.category || "Inne",
        description: parsedTemplate.description,
        content: parsedTemplate.content,
        fields: parsedTemplate.fields,
        target_audience: "client",
        risk_level: "low",
        is_active: false, // Require manual activation after import
      };

      const response = await legalTemplatesApi.create(dbPayload);

      toast({
        title: "Zapisano szablon",
        description:
          "Zapisano wzór do bazy danych. Pamiętaj by go aktywować.",
        variant: "default",
      });
      setParsedTemplate(null);
      setUrl("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast({
        title: "Błąd zapisu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <DownloadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Import szablonu z internetu (AI Parser)
            </h2>
            <p className="text-sm text-slate-500">
              Wklej link do darmowego wzoru, a model Gemini przekształci go w
              gotowy dokument dla systemu LexPortal.
            </p>
          </div>
        </div>

        <form onSubmit={handleScrape} className="flex gap-4">
          <Input
            type="url"
            placeholder="np. https://poradnikprzedsiebiorcy.pl/pobierz/umowy/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isScraping}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isScraping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            Importuj
          </Button>
        </form>
      </div>

      {parsedTemplate && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Podgląd Danych z AI
            </h3>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Zapisz Szablon w Bazie
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tytuł
                </span>
                <p className="font-medium">{parsedTemplate.title}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kategoria
                </span>
                <p className="font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm inline-block">
                  {parsedTemplate.category}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Opis
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {parsedTemplate.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4" /> Pola Wykryte (Formularz)
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {parsedTemplate.fields?.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm border border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded">
                        {f.id}
                      </span>
                      <span className="font-medium">{f.label}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {f.type}
                      </span>
                    </div>
                  ))}
                  {(!parsedTemplate.fields ||
                    parsedTemplate.fields.length === 0) && (
                      <p className="text-sm text-slate-500 italic">
                        Nie wykryto żadnych zmiennych pól.
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 overflow-y-auto max-h-[400px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Kod dokumentu (HTML)
              </span>
              <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {parsedTemplate.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tabela do przeglądu zaimportowanych szkiców */}
      <TemplateReviewer refreshKey={refreshKey} />
    </div>
  );
};
