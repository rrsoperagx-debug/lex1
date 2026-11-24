import React, { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Tag,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  format: "PDF" | "DOCX" | "MD";
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Prawo Rodzinne
  {
    id: "1",
    title: "Pozew o rozwód (bez orzekania o winie)",
    category: "Prawo Rodzinne",
    description: "Standardowy wzór pozwu o rozwód za porozumieniem stron.",
    format: "DOCX",
  },
  {
    id: "2",
    title: "Wniosek o alimenty",
    category: "Prawo Rodzinne",
    description: "Wniosek o ustalenie lub podwyższenie alimentów na dziecko.",
    format: "DOCX",
  },
  {
    id: "3",
    title: "Plan wychowawczy",
    category: "Prawo Rodzinne",
    description: "Dokument ustalający zasady opieki nad dziećmi po rozstaniu.",
    format: "DOCX",
  },
  {
    id: "4",
    title: "Wniosek o uregulowanie kontaktów",
    category: "Prawo Rodzinne",
    description:
      "Wniosek do sądu o ustalenie harmonogramu spotkań z dzieckiem.",
    format: "DOCX",
  },

  // Prawo Pracy
  {
    id: "5",
    title: "Wypowiedzenie umowy o pracę",
    category: "Prawo Pracy",
    description:
      "Rozwiązanie umowy o pracę przez pracownika z zachowaniem okresu wypowiedzenia.",
    format: "DOCX",
  },
  {
    id: "6",
    title: "Umowa o zakazie konkurencji",
    category: "Prawo Pracy",
    description:
      "Zabezpieczenie interesów pracodawcy po ustaniu stosunku pracy.",
    format: "DOCX",
  },
  {
    id: "7",
    title: "Skarga do PIP",
    category: "Prawo Pracy",
    description:
      "Wzór pisma do Państwowej Inspekcji Pracy ws. naruszeń praw pracowniczych.",
    format: "DOCX",
  },
  {
    id: "8",
    title: "Wniosek o urlop macierzyński",
    category: "Prawo Pracy",
    description: "Formalny wniosek o udzielenie urlopu po urodzeniu dziecka.",
    format: "DOCX",
  },

  // Nieruchomości
  {
    id: "9",
    title: "Umowa najmu mieszkania (okazjonalnego)",
    category: "Nieruchomości",
    description:
      "Zabezpieczona umowa najmu z oświadczeniem o poddaniu się egzekucji.",
    format: "PDF",
  },
  {
    id: "10",
    title: "Protokół zdawczo-odbiorczy",
    category: "Nieruchomości",
    description:
      "Dokument opisu stanu lokalu i liczników przy wydaniu/zwrocie.",
    format: "DOCX",
  },
  {
    id: "11",
    title: "Wezwanie do zapłaty czynszu",
    category: "Nieruchomości",
    description: "Ostateczne przedsądowe wezwanie do zapłaty zaległości.",
    format: "DOCX",
  },
  {
    id: "12",
    title: "Umowa przedwstępna kupna-sprzedaży",
    category: "Nieruchomości",
    description: "Zobowiązanie do zawarcia umowy przeniesienia własności.",
    format: "DOCX",
  },

  // Biznes i Spółki
  {
    id: "13",
    title: "NDA (Umowa o zachowaniu poufności)",
    category: "E-biznes",
    description: "Dwustronne zobowiązanie do ochrony tajemnic handlowych.",
    format: "DOCX",
  },
  {
    id: "14",
    title: "Umowa o świadczenie usług B2B",
    category: "E-biznes",
    description:
      "Ogólny wzór współpracy między firmami (Software Development/Marketing).",
    format: "DOCX",
  },
  {
    id: "15",
    title: "Uchwała o powołaniu Prezesa Zarządu",
    category: "KRS",
    description:
      "Dokument wymagany do aktualizacji danych w rejestrze sądowym.",
    format: "DOCX",
  },
  {
    id: "16",
    title: "Umowa spółki z o.o. (S24)",
    category: "KRS",
    description: "Standardowy wzór dla systemu elektronicznej rejestracji.",
    format: "PDF",
  },

  // E-commerce
  {
    id: "17",
    title: "Regulamin sklepu internetowego",
    category: "E-commerce",
    description:
      "Zbiór zasad sprzedaży, zwrotów i reklamacji (RODO compliant).",
    format: "MD",
  },
  {
    id: "18",
    title: "Polityka zwrotów i reklamacji",
    category: "E-commerce",
    description: "Uproszczona informacja dla klienta końcowego.",
    format: "DOCX",
  },
  {
    id: "19",
    title: "Oświadczenie o odstąpieniu od umowy",
    category: "E-commerce",
    description: "Wzór formularza dla konsumenta (14 dni na zwrot).",
    format: "PDF",
  },

  // Spadki
  {
    id: "20",
    title: "Testament własnoręczny (Holograficzny)",
    category: "Spadki",
    description:
      "Wskazówki i wzór sporządzenia ważnego testamentu bez notariusza.",
    format: "PDF",
  },
  {
    id: "21",
    title: "Odrzucenie spadku przed notariuszem",
    category: "Spadki",
    description: "Wzór oświadczenia chroniącego przed długami spadkowymi.",
    format: "DOCX",
  },

  // Inne
  {
    id: "22",
    title: "Upoważnienie do odbioru dokumentów",
    category: "Administracja",
    description: "Pełnomocnictwo pocztowe lub urzędowe.",
    format: "DOCX",
  },
  {
    id: "23",
    title: "Wniosek o udostępnienie informacji publicznej",
    category: "Administracja",
    description: "Pismo do urzędu o wgląd w dane publiczne.",
    format: "DOCX",
  },
  {
    id: "24",
    title: "Reklamacja usług telekomunikacyjnych",
    category: "Konsument",
    description: "Pismo ws. błędnego naliczenia opłat lub złej jakości usług.",
    format: "DOCX",
  },
  {
    id: "25",
    title: "Pozew o zapłatę (tryb upominawczy)",
    category: "Windykacja",
    description: "Wzór dla prostych spraw o długi z faktur/umów.",
    format: "DOCX",
  },
  {
    id: "26",
    title: "Sprzeciw od nakazu zapłaty",
    category: "Windykacja",
    description: "Pismo procesowe w odpowiedzi na otrzymany nakaz.",
    format: "DOCX",
  },
  {
    id: "27",
    title: "Wniosek o ogłoszenie upadłości konsumenckiej",
    category: "Inne",
    description: "Kompleksowy wniosek dla osób z nadmiernym zadłużeniem.",
    format: "PDF",
  },
  {
    id: "28",
    title: "Zawiadomienie o popełnieniu przestępstwa",
    category: "Karne",
    description: "Wzór pisma do Prokuratury lub na Policję.",
    format: "DOCX",
  },
  {
    id: "29",
    title: "Pełnomocnictwo procesowe",
    category: "Procesowe",
    description: "Upoważnienie adwokata do reprezentacji przed sądem.",
    format: "PDF",
  },
  {
    id: "30",
    title: "Wniosek o wgląd do akt sprawy",
    category: "Procesowe",
    description: "Prośba o udostępnienie dokumentacji sądowej.",
    format: "DOCX",
  },
];

const CATEGORIES = [
  "Wszystkie",
  ...Array.from(new Set(DOCUMENT_TEMPLATES.map((t) => t.category))),
];

const DocumentLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");

  const filteredTemplates = DOCUMENT_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Wszystkie" ||
      template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (title: string) => {
    alert(
      `Przygotowywanie pliku: ${title}. Pobieranie rozpocznie się za chwilę.`,
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Premium Search Header */}
      <header className="bg-[#0a2540] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Biblioteka Wzorów Dokumentów
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-light">
            Ponad 30 profesjonalnie przygotowanych szablonów prawnych gotowych
            do natychmiastowego wykorzystania.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Wyszukaj dokument (np. rozwód, najem, NDA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl shadow-2xl focus:ring-4 focus:ring-gold-500/20 outline-none transition-all text-slate-800 text-lg"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-1/4">
            <div className="bg-slate-50 rounded-3xl p-6 sticky top-24 border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-gold-500" />
                <h3 className="font-bold text-navy-950 uppercase tracking-widest text-sm">
                  Kategorie
                </h3>
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group
                      ${selectedCategory === cat ? "bg-navy-950 text-white shadow-lg shadow-navy-900/20" : "text-slate-600 hover:bg-white hover:text-navy-950"}`}
                  >
                    {cat}
                    {selectedCategory === cat ? (
                      <CheckCircle2 className="w-4 h-4 text-gold-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-300" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2 text-gold-500 mb-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-tight">
                    Wskazówka
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pamiętaj, że każdy wzór dokumentu powinien zostać dostosowany
                  do Twojej indywidualnej sytuacji prawnej. W razie wątpliwości
                  skonsultuj się z naszym prawnikiem.
                </p>
              </div>
            </div>
          </aside>

          {/* Documents Grid */}
          <main className="lg:w-3/4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
                Znaleziono:{" "}
                <span className="text-gold-500">
                  {filteredTemplates.length}
                </span>{" "}
                dokumentów
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                  DARMOWE DLA KLIENTÓW
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredTemplates.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-gold-500/30 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-gold-500/10 group-hover:text-gold-500 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                      {doc.format}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy-950 mb-2 group-hover:text-navy-900 leading-tight">
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <Tag className="w-3 h-3" />
                    {doc.category}
                  </div>

                  <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <button
                      onClick={() => handleDownload(doc.title)}
                      className="flex items-center gap-2 text-sm font-bold text-navy-950 hover:text-gold-500 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Pobierz szablon
                    </button>
                    <button className="p-2 text-slate-300 hover:text-navy-950 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Brak wyników
                </h3>
                <p className="text-slate-500">
                  Spróbuj zmienić słowa kluczowe lub kategorię wyszukiwania.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocumentLibrary;
