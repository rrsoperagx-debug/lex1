import React from "react";
import {
  Layout,
  Calendar,
  MessageSquare,
  Mail,
  CreditCard,
  Lock,
  Download,
  CheckCircle,
  Clock,
  ArrowRight,
  LogIn,
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  details: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Krok 1: Logowanie i Pulpit",
    description: "Jak czytać powiadomienia na Dashboardzie.",
    details:
      "Po zalogowaniu trafisz na swój personalny Pulpit. Sprawdzaj tutaj sekcję 'Ostatnie Powiadomienia', aby nie przegapić żadnej aktualizacji w swoich sprawach.",
    icon: <LogIn className="w-8 h-8" />,
    color: "blue",
  },
  {
    title: "Krok 2: Terminarz",
    description: "Jak dodać termin i sprawdzić dostępność prawnika.",
    details:
      "W sekcji Kalendarz znajdziesz harmonogram swoich rozpraw oraz spotkań. Możesz również sprawdzić wolne terminy i poprosić o rezerwację czasu z adwokatem.",
    icon: <Calendar className="w-8 h-8" />,
    color: "amber",
  },
  {
    title: "Krok 3: Bezpieczny Czat",
    description: "Jak wysyłać wiadomości i załączniki.",
    details:
      "Szybka komunikacja bezpośrednia. Przesyłaj zdjęcia dokumentów w czasie rzeczywistym. Wszystkie dane są szyfrowane end-to-end (E2EE).",
    icon: <MessageSquare className="w-8 h-8" />,
    color: "green",
  },
  {
    title: "Krok 4: Poczta i Pisma",
    description: "Odbiór pism procesowych, pogrubione tematy.",
    details:
      "Oficjalna korespondencja z kancelarii trafia do Poczty. Nowe, nieprzeczytane pisma są oznaczone pogrubionym tematem i czerwoną kropką.",
    icon: <Mail className="w-8 h-8" />,
    color: "indigo",
  },
  {
    title: "Krok 5: Płatności",
    description: "Jak pobrać fakturę i opłacić usługę.",
    details:
      "Zarządzaj swoimi finansami w jednym miejscu. Pobieraj faktury w formacie PDF i wykonuj błyskawiczne płatności online przez bezpieczne bramki.",
    icon: <CreditCard className="w-8 h-8" />,
    color: "slate",
  },
];

const PlatformGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans pb-20">
      {/* Print-only CSS */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; margin: 0 !important; }
            .guide-card { break-inside: avoid; border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
            .print-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
            h1 { color: #0a2540 !important; font-size: 24pt !important; }
          }
        `}
      </style>

      <div className="max-w-6xl mx-auto px-4 py-16 print-container">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-500 border border-gold-500/30 text-xs font-bold uppercase tracking-widest mb-4 no-print">
              <CheckCircle className="w-3 h-3" /> Instrukcja Obsługi
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-navy-950 mb-4 transition-all">
              Przewodnik po Platformie
            </h1>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              Odkryj możliwości swojej platformy prawnej. Dowiedz się, jak
              korzystać z kluczowych funkcji w kilku prostych krokach.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-3 bg-navy-950 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-navy-900/20 active:scale-95 transition-all group no-print"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            Pobierz Przewodnik (PDF)
          </button>
        </div>

        {/* Visual Timeline / Steps Grid */}
        <div className="space-y-12 relative">
          {/* Vertical Line for Tablet/Desktop */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 hidden md:block no-print" />

          {GUIDE_STEPS.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col md:flex-row items-center gap-8 relative group transition-all duration-500 ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Step Number Badge */}
              <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-navy-950 text-gold-500 flex items-center justify-center text-xs font-bold ring-4 ring-slate-100 z-10 md:flex no-print">
                {index + 1}
              </div>

              {/* Card Content */}
              <div className="w-full md:w-[45%]">
                <div className="guide-card bg-white rounded-[40px] p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-gold-500/30 hover:scale-[1.02] transition-all duration-300">
                  <div
                    className={`w-16 h-16 rounded-[20px] mb-6 flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12 duration-500 
                    ${
                      step.color === "blue"
                        ? "bg-blue-600 shadow-blue-200"
                        : step.color === "amber"
                          ? "bg-amber-600 shadow-amber-200"
                          : step.color === "green"
                            ? "bg-green-600 shadow-green-200"
                            : step.color === "indigo"
                              ? "bg-indigo-600 shadow-indigo-200"
                              : "bg-slate-950 shadow-slate-200"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-navy-950 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4">
                    {step.description}
                  </p>
                  <p className="text-slate-600 leading-relaxed font-normal">
                    {step.details}
                  </p>
                </div>
              </div>

              {/* Empty Space for alignment */}
              <div className="hidden md:block w-[45%]" />
            </div>
          ))}
        </div>

        {/* Print-only footer */}
        <div className="hidden print-only mt-20 pt-10 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm">
            LexPortal - Twoja Kancelaria Online | www.lexportal.pl
          </p>
        </div>

        {/* Security & Support Note (no-print) */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 no-print">
          <div className="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/50 flex gap-6">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy-950 mb-2">
                Szyfrowanie AES-256
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed font-normal">
                Twoje dane są bezpieczne. Każda wiadomość i załącznik przesyłany
                przez platformę jest chroniony protokołami bankowymi.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/50 flex gap-6">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy-950 mb-2">Wsparcie 24/7</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-normal">
                W razie problemów z obsługą systemu, skorzystaj z ikonki czatu w
                prawym dolnym rogu ekranu. Jesteśmy do Twojej dyspozycji.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformGuide;
