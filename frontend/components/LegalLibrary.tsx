import React, { useState, useEffect } from "react";
import {
  Library,
  Search,
  FileText,
  AlertTriangle,
  User,
  ArrowLeft,
  Download,
  Plus,
  Zap,
} from "lucide-react";
import legalTemplateService, {
  LegalTemplate,
} from "../services/legalTemplateService";
import LegalTemplateForm from "./LegalTemplateForm";
import { AnimatePresence } from "framer-motion";

const LegalLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LegalTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await legalTemplateService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      alert("Nie udało się załadować bazy pism.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(templates.map((t) => t.category))];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-emerald-100 text-emerald-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "high":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (selectedTemplate) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedTemplate.title}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {selectedTemplate.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${getRiskColor(selectedTemplate.risk_level)}`}
                >
                  Ryzyko: {selectedTemplate.risk_level}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 text-sm font-black text-slate-600 border-2 border-slate-200 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition-all">
              <Download className="w-4 h-4" /> EKSPORT MD
            </button>
            <button
              onClick={() => setIsGenerating(true)}
              className="px-6 py-2.5 text-sm font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-current" /> GENERUJ DOKUMENT
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-250px)]">
          {/* Metadata Sidebar */}
          <div className="w-80 border-r border-slate-100 p-6 bg-slate-50/30 overflow-y-auto">
            <section className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3 h-3" /> Adresat
              </h3>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-sm font-medium text-slate-700">
                  {selectedTemplate.target_audience === "operator"
                    ? "Operator / Prawnik"
                    : "Klient w portalu"}
                </span>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Wymagane Załączniki
              </h3>
              <div className="space-y-2">
                {selectedTemplate.required_attachments?.map(
                  (attachment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 text-sm text-slate-600 bg-white rounded-lg border border-slate-100"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {attachment}
                    </div>
                  ),
                )}
                {(!selectedTemplate.required_attachments ||
                  selectedTemplate.required_attachments.length === 0) && (
                  <p className="text-xs italic text-slate-400">Brak wymogów</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Uwagi Architektoniczne
              </h3>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed shadow-inner">
                Szablon obsługuje logikę warunkową (Jinja2-like). Wszystkie pola
                oznaczone <strong>&#123;&#123;TAG&#125;&#125;</strong> zostaną
                automatycznie wypełnione danymi z bazy CMS po wybraniu
                konkretnej sprawy.
              </div>
            </section>
          </div>

          {/* Content Preview */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-100/50">
            <div className="max-w-2xl mx-auto bg-white p-12 border border-slate-200 min-h-full rounded shadow-xl">
              <div className="prose prose-slate max-w-none font-serif text-slate-800 whitespace-pre-wrap">
                {selectedTemplate.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Library Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-600" /> Legal Templates
            Library
          </h1>
          <p className="text-slate-500 mt-1">
            Profesjonalna baza pism i umów ustrukturyzowanych (Smart Templates).
          </p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-slate-200">
          <Plus className="w-5 h-5 text-blue-400" /> Dodaj Nowy Wzór
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj wzoru (np. umowa o dzieło, wezwanie...)"
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "all" ? "Wszystkie" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="group relative bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col min-h-[320px]"
            >
              {/* Animated background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[34px] opacity-0 group-hover:opacity-10 blur transition duration-1000 group-hover:duration-200"></div>

              <div className="relative flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-50/50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 ease-out shadow-inner">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getRiskColor(template.risk_level)} shadow-sm`}
                  >
                    {template.risk_level} risk
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                    {template.custom_id}
                  </span>
                </div>
              </div>

              <div className="relative">
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                  {template.title}
                </h3>

                <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-6 leading-relaxed">
                  {template.description ||
                    template.content.substring(0, 120) + "..."}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {template.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  Configure <Zap className="w-4 h-4 fill-current" />
                </div>
              </div>

              {/* Glassmorphism overlay on hover */}
              <div className="absolute inset-0 bg-linear-to-br from-white/0 via-white/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTemplates.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Brak wyników</h3>
          <p className="text-slate-500 mt-2">
            Nie znaleźliśmy wzoru pasującego do Twojego zapytania.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Wyczyść filtry
          </button>
        </div>
      )}
      <AnimatePresence>
        {isGenerating && selectedTemplate && (
          <LegalTemplateForm
            template={selectedTemplate}
            onClose={() => setIsGenerating(false)}
            onSuccess={(data) => {
              console.log("Document generated:", data);
              // Handle success if needed (e.g. refresh documents list)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LegalLibrary;
