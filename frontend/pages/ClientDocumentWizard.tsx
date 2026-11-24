import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ChevronRight,
  Check,
  Search,
  History,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TemplateField {
  id: string;
  label: string;
  type: string;
}

interface DocumentTemplate {
  id: string;
  title: string;
  cat?: string;
  category?: string;
  fields: TemplateField[];
  content?: string;
}

export const ClientDocumentWizard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Wybór, 2: Formularz, 3: Pobieranie
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Realne dane z bazy (lub przykładowe jako fallback)
  const [availableDocs, setAvailableDocs] = useState<DocumentTemplate[]>([
    {
      id: "T-WORK-002",
      title: "Umowa o Dzieło",
      cat: "Umowy",
      fields: [
        { id: "DATA_UMOWY", label: "Data zawarcia", type: "date" },
        { id: "KWOTA_BRUTTO", label: "Wynagrodzenie (PLN)", type: "number" },
        { id: "OPIS_DZIELA", label: "Co jest przedmiotem prac?", type: "text" },
      ],
    },
    {
      id: "T-NDA-003",
      title: "Umowa Poufności (NDA)",
      cat: "Bezpieczeństwo",
      fields: [
        { id: "KWOTA_KARY", label: "Kara za wyciek danych", type: "number" },
      ],
    },
  ]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingDocs(true);
      try {
        const response = await fetch("/api/v1/legal-templates/?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          // Pobrane z bazy, filtrujemy tylko aktywne dla klienta
          const activeDocs = data.filter((doc: any) => doc.is_active);
          if (activeDocs.length > 0) {
            setAvailableDocs(
              activeDocs.map((doc: any) => ({
                id: doc.id,
                title: doc.title,
                cat: doc.category || "Inne",
                fields: doc.fields || [],
              })),
            );
          }
        }
      } catch (error) {
        console.error("Błąd pobierania aktywnych szablonów:", error);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchTemplates();
  }, [token]);

  const handleStart = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    setFormData({});
    setStep(2);
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const generateFinalPdf = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/v1/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          template_id: selectedDoc?.id,
          data: formData
        })
      });

      if (response.ok) {
        setStep(3);
      } else {
        const errorData = await response.json();
        console.error("Generator Error:", errorData);
        alert(`Błąd: ${errorData.detail || "Nie udało się wygenerować dokumentu"}`);
      }
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Wystąpił błąd podczas połączenia z serwerem.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* HEADER */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <div
          className="text-2xl font-bold text-indigo-700 flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <FileText /> Lexportal
        </div>
        <div className="flex gap-6 text-sm font-medium text-slate-600 items-center">
          <button
            onClick={() => setStep(1)}
            className="hover:text-indigo-600 flex items-center gap-1"
          >
            <Search size={16} /> Katalog
          </button>
          <button
            onClick={() => navigate("/client-dashboard")}
            className="hover:text-indigo-600 flex items-center gap-1"
          >
            <History size={16} /> Moje Dokumenty
          </button>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
            JK
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-10 px-6 flex-1 w-full relative">
        {/* KROK 1: Wybór dokumentu */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Witaj w Kreatorze Pism</h1>
            <p className="text-slate-500 mb-8">
              Wybierz dokument, który chcesz dziś przygotować.
            </p>

            {isLoadingDocs ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-6 rounded-xl shadow-sm border hover:border-indigo-400 transition-all cursor-pointer group"
                    onClick={() => handleStart(doc)}
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{doc.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{doc.cat}</p>
                    <button className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
                      Rozpocznij <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availableDocs.length === 0 && !isLoadingDocs && (
              <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed">
                Brak dostępnych aktywnych szablonów w bazie dla klientów.
              </div>
            )}
          </div>
        )}

        {/* KROK 2: Formularz (Generator dynamiczny) */}
        {step === 2 && selectedDoc && (
          <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg border">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 mb-4 hover:text-indigo-600 transition-colors"
              >
                &larr; Powrót do listy
              </button>
              <h2 className="text-2xl font-bold mb-6">
                Uzupełnij dane do: {selectedDoc.title}
              </h2>

              <div className="space-y-6">
                {selectedDoc.fields && selectedDoc.fields.length > 0 ? (
                  selectedDoc.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type={
                          field.type === "date"
                            ? "date"
                            : field.type === "number"
                              ? "number"
                              : "text"
                        }
                        className="w-full border-slate-200 border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder={`Wpisz ${field.label.toLowerCase()}...`}
                        value={formData[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">
                    Ten dokument nie wymaga dodatkowych danych formularza.
                  </p>
                )}
              </div>

              <button
                onClick={generateFinalPdf}
                disabled={isGenerating}
                className="w-full mt-10 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generowanie dokumentu...
                  </>
                ) : (
                  "Generuj Gotowy PDF"
                )}
              </button>
            </div>

            <div className="w-full md:w-1/3 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 self-start sticky top-6">
              <h4 className="font-bold text-indigo-900 mb-4">
                Dlaczego to jest ważne?
              </h4>
              <p className="text-sm text-indigo-800 leading-relaxed italic">
                &quot;Poprawne uzupełnienie przedmiotu i stawek chroni Twoje
                prawa i ułatwia ewentualne rozliczenia z wykonawcą.&quot;
              </p>
              <div className="mt-6 p-4 bg-white rounded-lg text-xs text-slate-500 flex items-start gap-2 border border-indigo-100">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Status:</strong> Dane są na żywo walidowane przez
                  wirtualnego prawnika AI Lexportal.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* KROK 3: Pobieranie i sukces */}
        {step === 3 && (
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl border max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Dokument Gotowy!</h2>
            <p className="text-slate-500 mb-10">
              Twój dokument został wygenerowany, zabezpieczony i zapisany w
              Twoim strumieniu danych Lexportal.
            </p>

            <div className="flex flex-col gap-4">
              <button className="bg-indigo-600 text-white py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                <Download size={20} /> Pobierz Plik PDF
              </button>
              <button
                onClick={() => navigate("/document-analysis")}
                className="border border-slate-200 py-4 px-8 rounded-xl font-medium hover:bg-slate-50 transition-all text-slate-600"
              >
                Wyślij do bezpiecznego podpisu elektornicznego
              </button>
            </div>
            <button
              onClick={() => {
                setStep(1);
                setSelectedDoc(null);
                setFormData({});
              }}
              className="mt-8 text-indigo-600 font-medium hover:underline"
            >
              &larr; Stwórz kolejne pismo
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDocumentWizard;
