import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle,
  Code,
  Trash2,
  AlertCircle,
  Wand2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { legalTemplatesApi } from "@/services/api";

interface TemplateField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
}

interface TemplateData {
  id: string;
  title: string;
  category?: string;
  status?: string;
  is_active: boolean;
  fields: TemplateField[];
  content: string; // html content
}

interface TemplateReviewerProps {
  refreshKey?: number;
}

export const TemplateReviewer: React.FC<TemplateReviewerProps> = ({
  refreshKey = 0,
}) => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiFixing, setIsAiFixing] = useState(false);

  // Pobranie danych z bazy (tylko szkice / do weryfikacji)
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await legalTemplatesApi.list(100);
      // Filtrujemy do tych nieaktywnych (PENDING_REVIEW)
      const pendingTemplates = data.filter((t: TemplateData) => !t.is_active);
      setTemplates(pendingTemplates);
      if (pendingTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(pendingTemplates[0]);
      }
    } catch (error) {
      console.error("Błąd pobierania szablonów", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token, refreshKey]);

  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const payload = {
        title: selectedTemplate.title,
        content: selectedTemplate.content,
        fields: selectedTemplate.fields,
      };
      await legalTemplatesApi.update(selectedTemplate.id, payload);

      toast({
        title: "Zapisano",
        description: "Zmiany w szkicu zostały zapisane.",
      });
      fetchTemplates();
    } catch (e) {
      toast({
        title: "Błąd",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const payload = {
        title: selectedTemplate.title,
        content: selectedTemplate.content,
        fields: selectedTemplate.fields,
        is_active: true, // Publikacja
      };
      await legalTemplatesApi.update(selectedTemplate.id, payload);

      toast({
        title: "Opublikowano!",
        description: "Dokument jest teraz widoczny dla klientów Lexportal.",
      });
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (e: any) {
      toast({ title: "Błąd", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiFix = async () => {
    if (!selectedTemplate) return;
    setIsAiFixing(true);
    try {
      const response = await legalTemplatesApi.fix({
        title: selectedTemplate.title,
        content: selectedTemplate.content,
        fields: selectedTemplate.fields,
      });

      if (response.status === "success") {
        setSelectedTemplate({
          ...selectedTemplate,
          title: response.data.title,
          content: response.data.content,
          fields: response.data.fields,
        });

        toast({
          title: "AI naprawiło szablon!",
          description: response.data.fix_notes || "Poprawiono strukturę i tagi.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Błąd AI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAiFixing(false);
    }
  };

  const handleUpdateField = (
    index: number,
    key: keyof TemplateField,
    value: string,
  ) => {
    if (!selectedTemplate) return;
    const newFields = [...selectedTemplate.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setSelectedTemplate({ ...selectedTemplate, fields: newFields });
  };

  const handleDeleteField = (index: number) => {
    if (!selectedTemplate) return;
    const newFields = selectedTemplate.fields.filter((_, i) => i !== index);
    setSelectedTemplate({ ...selectedTemplate, fields: newFields });
  };

  const handleAddField = () => {
    if (!selectedTemplate) return;
    const newFields = [
      ...(selectedTemplate.fields || []),
      { id: "nowe_pole", label: "Nowe Pole", type: "text" },
    ];
    setSelectedTemplate({ ...selectedTemplate, fields: newFields });
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-500">
        Ładowanie szablonów...
      </div>
    );
  if (!templates.length && !selectedTemplate)
    return (
      <div className="p-8 text-center text-slate-500">
        Brak zeskrapowanych dokumentów oczekujących na weryfikację.
      </div>
    );

  return (
    <div className="flex h-[800px] bg-slate-50 font-sans border rounded-xl overflow-hidden mt-6">
      {/* SIDEBAR: Lista zeskrapowanych pism */}
      <div className="w-1/3 max-w-[300px] bg-white border-r shadow-sm overflow-y-auto">
        <div className="p-4 bg-indigo-600 text-white font-bold flex items-center gap-2 sticky top-0">
          <Code size={20} /> Lexportal AI Review
        </div>
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTemplate(t)}
            className={`p-4 border-b cursor-pointer hover:bg-indigo-50 transition-colors ${selectedTemplate?.id === t.id ? "bg-indigo-50 border-l-4 border-indigo-600" : ""}`}
          >
            <h3 className="font-medium text-gray-800 text-wrap break-all">
              {t.title}
            </h3>
            <span className="text-xs text-orange-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} /> Oczekuje na weryfikację
            </span>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT: Edytor i Podgląd */}
      {selectedTemplate ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <div className="bg-white p-4 shadow-sm flex flex-wrap justify-between items-center px-8 gap-4">
            <h2 className="text-xl font-semibold text-gray-700 truncate max-w-[50%]">
              {selectedTemplate.title}
            </h2>
            <div className="flex gap-3">
              <button
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Zapisz szkic
              </button>
              <button
                disabled={isSaving}
                onClick={handlePublish}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                <CheckCircle size={18} /> Zatwierdź i Publikuj
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex px-8 mt-4">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-6 py-2 border-b-2 font-medium ${activeTab === "editor" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}
            >
              Edytor Struktury
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-2 border-b-2 font-medium ${activeTab === "preview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}
            >
              Podgląd Dokumentu
            </button>
          </div>

          {/* Editor Area */}
          <div className="p-8 flex-1 overflow-y-auto bg-slate-100">
            {activeTab === "editor" ? (
              <div className="flex flex-col xl:flex-row gap-8 h-full">
                {/* Kolumna 1: Pola zmienne */}
                <div className="bg-white p-6 rounded-lg shadow-sm border flex-1 xl:w-1/2 overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">
                    Definicje pól (Tags)
                  </h3>
                  {selectedTemplate.fields?.map((field, idx) => (
                    <div key={idx} className="flex gap-2 mb-3 items-center">
                      <input
                        className="border p-2 rounded w-1/3 bg-gray-50 text-sm font-mono"
                        value={field.id}
                        onChange={(e) =>
                          handleUpdateField(idx, "id", e.target.value)
                        }
                      />
                      <input
                        className="border p-2 rounded w-1/2 text-sm"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateField(idx, "label", e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleDeleteField(idx)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddField}
                    className="mt-4 text-indigo-600 font-medium hover:underline"
                  >
                    + Dodaj pole
                  </button>
                </div>

                {/* Kolumna 2: Kod HTML (Handlebars) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border flex-1 xl:w-1/2 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      Treść HTML (Template)
                    </h3>
                    <button
                      onClick={handleAiFix}
                      disabled={isAiFixing}
                      className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                    >
                      {isAiFixing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 size={14} />
                      )}
                      Ask AI to Fix
                    </button>
                  </div>
                  <textarea
                    className="w-full flex-1 font-mono text-sm border p-4 rounded bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedTemplate.content || ""}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        content: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              /* Tab Podgląd: PDF Look */
              <div className="bg-white max-w-4xl mx-auto p-12 shadow-xl min-h-full border border-gray-200">
                <div
                  className="prose prose-blue max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: (selectedTemplate.content || "").replace(
                      /{{(.*?)}}/g,
                      '<span class="bg-yellow-200 px-1 border border-yellow-400 rounded text-yellow-900 font-mono text-xs">[$1]</span>',
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Wybierz dokument z listy...
        </div>
      )}
    </div>
  );
};

export default TemplateReviewer;
