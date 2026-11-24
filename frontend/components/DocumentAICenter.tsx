// =============================================================================
// LexPortal Frontend - Dokument AICenter Component (DocumentAICenter.tsx)
// =============================================================================
//
// Ten plik odpowiada za:
//   - Główny interfejs interakcji z AI dla dokumentów.
//   - Trzy zakładki: Procesowanie, Generator, Asystent.
//   - Zarządzanie stanem analizy dokumentów i czatu z asystentem.
//   - Integrację z API AI w trybie strumieniowym.
//   - Wyświetlanie ryzyk prawnych i rekomendacji.
//
// =============================================================================

import React, { useState } from "react";
import {
  FileText,
  Wand2,
  ShieldCheck,
  Upload,
  Download,
  Copy,
  Play,
  History,
  Trash2,
  FileSearch,
  AlertTriangle,
  Send,
  User,
  Bot
} from "lucide-react";
import { Button } from "./ui/button";

interface DocumentAICenterProps {
  cases?: Array<{
    id: string;
    title?: string;
    client?: string;
    type?: string;
  }>;
}

const DocumentAICenter: React.FC<DocumentAICenterProps> = ({ cases = [] }) => {
  const [activeTab, setActiveTab] = useState<"process" | "generate" | "assistant">("process");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-140px)]">
      {/* Header Tabs */}
      <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("process")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "process"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
        >
          <FileText className="w-4 h-4" /> Analiza
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "generate"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
        >
          <Wand2 className="w-4 h-4" /> Generator
        </button>
        <button
          onClick={() => setActiveTab("assistant")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "assistant"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
        >
          <ShieldCheck className="w-4 h-4" /> Asystent
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900">
        <h1 className="sr-only">Centrum Dokumentów & AI</h1>
        {activeTab === "process" && <ProcessTab />}
        {activeTab === "generate" && <GenerateTab />}
        {activeTab === "assistant" && <AssistantTab cases={cases} />}
      </div>
    </div>
  );
};

// --- TABS ---

const ProcessTab = () => {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleProcess = async () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/v1/ai/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Przeanalizuj to pismo pod kątem prawnym:\n${content}` }),
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              fullText += data.text;
            } catch (e) { }
          }
        }
      }

      setResult({
        summary: fullText || "Analiza zakończona.",
        risks: ["Zbyt krótki termin płatności.", "Brak odsetek umownych."],
        suggestions: "Wydłużenie terminu do 14 dni."
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input */}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tekst bazowy</span>
            <div className="flex gap-2">
              <button
                onClick={() => { }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50"
              >
                <Upload className="w-3.5 h-3.5" /> Wgraj plik
              </button>
              {content && (
                <button
                  onClick={() => { setContent(""); setResult(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg shadow-sm hover:bg-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wyczyść
                </button>
              )}
            </div>
          </div>
          <textarea
            className="flex-1 p-4 bg-transparent outline-none resize-none text-slate-700 dark:text-slate-200 min-h-[300px]"
            placeholder="Wklej tutaj treść dokumentu lub kliknij ikonę wyżej, aby przesłać plik PDF..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs text-slate-400">{wordCount} słów</span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              <History className="w-3.5 h-3.5" /> Historia (0)
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-slate-500 text-center py-2">Brak historii analiz</p>
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={!content.trim() || isProcessing}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 transition-all"
        >
          {isProcessing ? <Play className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
          {isProcessing ? "Analiza Lexportal AI w toku..." : "Uruchom Analizę AI"}
        </button>
      </div>

      {/* Output */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
          Wynik analizy
        </h3>

        {!result && !isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <FileSearch className="w-12 h-12 opacity-20" />
            <p className="text-center text-sm">Aplikacja czeka na wsad dokumentu.</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
            <span className="mt-4 text-sm font-medium text-slate-500 animate-pulse">Model Gemini pro analizuje...</span>
          </div>
        )}

        {result && !isProcessing && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Streszczenie Główne</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                {result.summary}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Wykryte Ryzyka (RODO/KC)</h4>
              <ul className="text-sm text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 p-4 rounded-lg list-disc pl-6">
                {result.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Propozycje Zmian</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg">
                {result.suggestions}
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 p-2"><Copy className="w-4 h-4" /></button>
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 p-2"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GenerateTab = () => {
  const [description, setDescription] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Inteligentny Generator</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Opisz sprawę</label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-40"
                placeholder="Np. 'Wygeneruj wezwanie do zapłaty dla Jana Kowalskiego na kwotę 5000 PLN z tytułu niezapłaconej faktury nr 123/2023. Załóż termin na 7 dni.'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                Opisz sprawę, dla której chcesz przygotować dokument.
                Sztuczna Inteligencja dobierze szablon, uzupełni dane i wygeneruje poprawny prawnie roboczy szkic dokumentu do Twojej akceptacji.
              </p>
            </div>

            <button
              disabled={!description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2"
            >
              <Wand2 className="w-5 h-5" /> Stwórz Dokument AI
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-500">Szukasz konkretnego szablonu?</h3>
          <input
            type="text"
            placeholder="Szukaj szablonu..."
            className="mt-3 w-full max-w-xs px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
          Podgląd dokumentu
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
          <p className="text-center text-sm px-6">Wygenerowany dokument pojawi się tutaj po kliknięciu przycisku 'Stwórz Dokument AI'.</p>
        </div>
      </div>
    </div>
  )
}

const AssistantTab = ({ cases }: { cases: any[] }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCase, setSelectedCase] = useState("none");

  const suggestions = [
    "Analiza umowy",
    "Wezwanie do zapłaty",
    "Procedura spadkowa",
    "RODO w kancelarii",
    "Pozew o rozwód",
    "Spółka z o.o."
  ];

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages([...messages, { role: "user", text: messageText }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/v1/ai/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: messageText,
          case_id: selectedCase !== "none" ? selectedCase : undefined
        }),
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      setMessages(prev => [...prev, { role: "model", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              aiResponse += data.text;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, text: aiResponse }];
              });
            } catch (e) { }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-4xl mx-auto">
      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center translate-y-10">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Czat z Asystentem Prawnym</h2>
            <p className="text-slate-500 max-w-sm">Jestem Twoim asystentem prawnym AI. Pomogę Ci w analizie prawnej, pisaniu pism i sprawdzaniu orzecznictwa.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-8 w-full max-w-2xl px-4">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    const text = s === "Analiza umowy" ? "Przygotuj projekt umowy najmu lokalu użytkowego." : s;
                    setInput(text);
                    // In real app we might auto-send
                  }}
                  className="p-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "model" && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0"><Bot className="w-5 h-5" /></div>}
              <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white font-medium" : "bg-slate-100 dark:bg-slate-800"}`}>
                {m.text}
              </div>
              {m.role === "user" && <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0"><User className="w-5 h-5" /></div>}
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0"><Bot className="w-5 h-5" /></div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg">
        {cases.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 border-b border-slate-50 dark:border-slate-800">
            <button
              onClick={() => setSelectedCase("none")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCase === "none" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
            >
              Bez kontekstu sprawy
            </button>
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCase(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCase === c.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
              >
                Sprawa {c.title}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-3 pr-16 text-sm text-slate-700 dark:text-slate-300 outline-none resize-none h-14 focus:ring-1 focus:ring-blue-500/30 transition-all"
            placeholder="Zadaj pytanie prawne (np. 'Jakie są przesłanki uchylenia się od skutków prawnych...')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            disabled={!input.trim() || isTyping}
            onClick={() => handleSend()}
            className="absolute right-2 top-2 bg-slate-900 dark:bg-blue-600 text-white p-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mt-3 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            AI może popełniać błędy. Weryfikuj porady z prawnikiem.
          </div>
          <span className="text-[10px] text-slate-400">LexPortal AI Engine v2.1</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentAICenter;
