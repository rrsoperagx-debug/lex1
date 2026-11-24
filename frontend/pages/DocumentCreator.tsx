import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  PenTool,
  CheckCircle2,
} from "lucide-react";
import formService, { FormTemplate } from "../services/formService";
import SmartFormRenderer from "../components/forms/SmartFormRenderer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const DocumentCreator: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState<{
    id: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await formService.getTemplates();
        setTemplates(data);
      } catch (error: unknown) {
        // Changed error type to unknown
        console.error("Failed to fetch templates:", error); // Kept original log message as the context is fetching templates
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase())),
  );

  const handleComplete = (docId: string, url: string) => {
    setGeneratedDoc({ id: docId, url });
    setSelectedTemplate(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedTemplate(null)}
            className="font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
          >
            Anuluj i wróć do listy
          </Button>
        </div>
        <SmartFormRenderer
          template={selectedTemplate}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight"
          >
            Kreator Dokumentów <br />
            <span className="text-emerald-500 italic relative">
              Urzędowych
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute -bottom-2 left-0 h-2 bg-emerald-500/20 rounded-full"
              />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed"
          >
            Wybierz wniosek, wypełnij interaktywny formularz Millennium-style, a
            my zajmiemy się resztą. Generujemy oficjalne pliki PDF gotowe do
            podpisu Autenti.
          </motion.p>
        </div>

        <AnimatePresence>
          {generatedDoc && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-12 bg-white border-2 border-emerald-500/10 p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-emerald-500/10 gap-8"
            >
              <div className="flex items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
                    Dokument wygenerowany!
                  </h3>
                  <p className="text-slate-500 font-bold text-lg opacity-80">
                    Twój wniosek jest gotowy do podpisu elektronicznego.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => window.open(generatedDoc.url, "_blank")}
                  className="h-16 px-10 rounded-2xl font-black shadow-sm border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-lg"
                >
                  Podgląd PDF
                </Button>
                <Button
                  className="bg-slate-900 text-white h-16 px-10 rounded-2xl font-black shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all text-lg group"
                  onClick={() => {
                    alert(
                      `Symulacja API: Przesyłanie dokumentu ${generatedDoc.id} do platformy Autenti...`,
                    );
                  }}
                >
                  Podpisz Autenti{" "}
                  <PenTool className="ml-2 w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row gap-6 mb-16">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-5 text-slate-400 w-6 h-6" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Wyszukaj wniosek (np. ZUS, US, Pozew)..."
              className="h-16 pl-16 bg-white border-none rounded-[20px] shadow-sm font-bold text-slate-700 text-lg placeholder:text-slate-300"
            />
          </div>
          <Button
            variant="outline"
            className="h-16 px-10 rounded-[20px] border-none bg-white shadow-sm font-black text-slate-500 text-lg hover:shadow-md transition-shadow"
          >
            <Filter className="mr-2 w-5 h-5" /> Filtry
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {isLoading ? (
            [1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white h-80 rounded-[40px] animate-pulse shadow-sm border border-slate-50"
              />
            ))
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -12 }}
                className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 block opacity-80">
                  {template.category || "General"}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mb-6 leading-tight group-hover:text-emerald-700 transition-colors grow">
                  {template.title}
                </h3>
                <div className="flex items-center text-slate-400 font-black uppercase tracking-tighter text-xs group-hover:text-slate-900 transition-colors pt-4 border-t border-slate-50">
                  Rozpocznij wypełnianie{" "}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[40px] shadow-inner border border-slate-50">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                Nie znaleziono szablonu
              </h3>
              <p className="text-slate-400 font-bold italic">
                Spróbuj wpisać inną nazwę dokumentu.
              </p>
            </div>
          )}

          <motion.div
            whileHover={{ scale: 0.98 }}
            className="bg-slate-900/5 border-2 border-dashed border-slate-200 p-10 rounded-[40px] flex flex-col items-center justify-center text-center group cursor-not-allowed h-full min-h-[320px]"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:rotate-45 transition-transform duration-500">
              <Plus className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 mb-2 tracking-tight leading-tight">
              Potrzebujesz <br />
              innego wzoru?
            </h3>
            <p className="text-slate-300 font-black uppercase tracking-tighter text-[10px]">
              Poinformuj nas – dodamy go!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreator;
