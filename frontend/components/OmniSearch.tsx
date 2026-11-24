import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowRight, CornerDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IntentResponse {
    intent: string;
    action: string;
    confidence: number;
    entities: Record<string, any>;
}

export const OmniSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<IntentResponse | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        const handleCustomOpen = () => setIsOpen(true);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-omni-search", handleCustomOpen);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-omni-search", handleCustomOpen);
        };
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        } else {
            setQuery("");
            setResult(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsProcessing(true);
        setResult(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/v1/ai/intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ query }),
            });

            if (!res.ok) {
                throw new Error("Failed to process intent");
            }

            const data: IntentResponse = await res.json();
            setResult(data);
            handleRouting(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRouting = (intentData: IntentResponse) => {
        setTimeout(() => {
            setIsOpen(false);
            switch (intentData.intent) {
                case "document_generation":
                    navigate("/document-creator", { state: { query: query, expectedDoc: intentData.entities?.document_type } });
                    break;
                case "legal_advice":
                    navigate("/assistant", { state: { initialPrompt: query } });
                    break;
                case "dashboard_navigation":
                case "support":
                    navigate("/client-dashboard"); // Basic fallback
                    break;
                default:
                    navigate("/assistant", { state: { initialPrompt: query } });
                    break;
            }
        }, 1500); // Wait 1.5s to show result animation
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Search Dialog */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-slate-100 text-lg px-4 outline-none placeholder:text-slate-400"
                        placeholder="Opisz, co chcesz zrobić (np. 'Chcę napisać pozew o rozwód')"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isProcessing}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <CornerDownLeft className="w-3 h-3 mr-1" /> Enter
                            </kbd>
                        )}
                    </div>
                </form>

                {/* Results Area */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 min-h-[120px] flex flex-col justify-center">
                    {!isProcessing && !result && (
                        <div className="text-center text-slate-500 text-sm">
                            Napisz wszystko naturalnym językiem. AI zrozumie Twoją intencję i przeniesie Cię we właściwe miejsce.
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-blue-600">
                            <span className="text-sm font-medium animate-pulse">Lexportal AI analizuje Twoją intencję...</span>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Rozpoznano: {result.intent === "document_generation" ? "Kreator Dokumentów" : result.intent === "legal_advice" ? "Asystent Prawny" : "Nawigacja"}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        Pewność: {(result.confidence * 100).toFixed(0)}% • Przygotowuję odpowiedni widok.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
