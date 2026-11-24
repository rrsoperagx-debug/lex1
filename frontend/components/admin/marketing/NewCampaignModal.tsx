/**
 * ============================================================================
 * LexPortal - Komponent: Modal Tworzenia Kampanii AI
 * ============================================================================
 *
 * Opis:
 * Ten plik zawiera główny komponent React (`NewCampaignModal`) służący do
 * tworzenia nowych, inteligentnych kampanii marketingowych. Jest to serce
 * interfejsu użytkownika modułu marketingowego w panelu admina.
 *
 * Przepływ pracy (Workflow):
 * 1. Krok 1: Definicja Celu
 *    - Użytkownik wprowadza podstawowe dane kampanii: nazwę, kanał, budżet
 *      i cel biznesowy.
 *    - Formularz jest walidowany przy użyciu `react-hook-form` i `zod`.
 *
 * 2. Krok 2: AI Insights
 *    - Po kliknięciu "Generuj Strategię", wysyłane jest zapytanie do backendu
 *      (`/api/v1/marketing/generate-plan`).
 *    - Otrzymany od AI plan (persona, słowa kluczowe, nagłówki) jest
 *      wyświetlany w czytelnych modułach, w tym `GoogleAdsPreview`.
 *
 * 3. Krok 3: Dystrybucja (Launchpad)
 *    - Przycisk "Uruchom kampanię" wykonuje trzy kluczowe akcje:
 *      a) Zapisuje finalną kampanię (wraz z planem AI) w bazie danych.
 *      b) Kopiuje wygenerowane słowa kluczowe do schowka użytkownika.
 *      c) Przekierowuje użytkownika do odpowiedniego menedżera reklam
 *         (Google Ads, Meta Ads, etc.).
 *
 * Architektura:
 * - Komponent jest w pełni state-driven (`useState` do zarządzania krokami).
 * - Wykorzystuje serwis `marketingApi` do komunikacji z backendem.
 * - Używa biblioteki `lucide-react` do ikon i ma zdefiniowany system
 *   stylistyczny "Premium Corporate" inspirowany czystym, nowoczesnym designem.
 * ============================================================================
 */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Megaphone,
  Target,
  Zap,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { GoogleAdsPreview } from "./GoogleAdsPreview";
import { marketingApi } from "../../../services/marketing";

// Walidacja
const campaignSchema = z.object({
  name: z.string().min(5, "Nazwa jest za krótka"),
  channel: z.enum([
    "google_ads",
    "meta_ads",
    "linkedin_ads",
    "newsletter",
    "seo_content",
  ]),
  budget: z.number().min(100, "Budżet min. 100 PLN"),
  goal: z.string().min(10, "Opisz cel bardziej szczegółowo"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface AIBrief {
  audience_persona: string;
  keywords: string[];
  ad_headlines: string[];
  ad_descriptions: string[];
  usp: string[];
  suggested_cta: string;
}

export const NewCampaignModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: () => void;
}> = ({ isOpen, onClose, onCampaignCreated }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiBrief, setAiBrief] = useState<AIBrief | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { budget: 500, channel: "google_ads" },
  });

  const onGeneratePlan = async (data: CampaignFormValues) => {
    setIsGenerating(true);
    try {
      const response = await marketingApi.generatePlan(data.goal, data.channel);
      setAiBrief(response);
      setStep(2);
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("Nie udało się wygenerować planu przez AI. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Błąd kopiowania:", err);
    }
  };

  const handleLaunchAds = async () => {
    setIsSaving(true);
    try {
      // 1. Zapisz w bazie danych
      const campaignData = {
        name: watch("name"),
        channel: watch("channel"),
        budget: watch("budget"),
        goal: watch("goal"),
        ai_generated_plan: aiBrief,
      };

      await marketingApi.createCampaign(campaignData);

      // 2. Kopiuj słowa kluczowe
      const keywordsText = aiBrief?.keywords?.join(", ") || "";
      await copyToClipboard(keywordsText);

      // 3. Powiadom rodzica
      if (onCampaignCreated) onCampaignCreated();

      // 4. Nawigacja
      setTimeout(() => {
        const adsUrl =
          watch("channel") === "google_ads"
            ? "https://ads.google.com/nav/selectaccount"
            : watch("channel") === "meta_ads"
              ? "https://ads.facebook.com/adsmanager"
              : "https://www.linkedin.com/campaignmanager/accounts";

        window.open(adsUrl, "_blank");
        onClose();
        setStep(1);
        setAiBrief(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to save campaign:", error);
      alert("Błąd podczas zapisywania kampanii.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Lewy panel - Stepper */}
          <div className="md:w-1/3 bg-slate-50 p-8 border-r border-slate-100 hidden md:block">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white w-fit mb-6">
              <Megaphone className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-8">
              Kreator Inteligentnej Kampanii
            </h2>

            <div className="space-y-6">
              <StepItem
                num={1}
                title="Definicja Celu"
                active={step === 1}
                done={step > 1}
              />
              <StepItem
                num={2}
                title="AI Insights"
                active={step === 2}
                done={step > 2}
              />
              <StepItem
                num={3}
                title="Dystrybucja"
                active={step === 3}
                done={step > 3}
              />
            </div>
          </div>

          {/* Prawy panel - Treść */}
          <div className="md:w-2/3 p-6 md:p-10 overflow-y-auto relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {step === 1 && (
              <form
                onSubmit={handleSubmit(onGeneratePlan)}
                className="space-y-6 animate-in slide-in-from-right duration-500"
              >
                <header>
                  <h3 className="text-xl font-bold text-slate-900">
                    Co chcesz dziś osiągnąć?
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Ustaw parametry, a nasze AI przygotuje strategię.
                  </p>
                </header>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Nazwa kampanii
                    </label>
                    <input
                      {...register("name")}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                      placeholder="np. Promocja: Analiza Umów Jesień 2026"
                    />
                    {errors.name && (
                      <p className="text-rose-500 text-xs mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Kanał
                      </label>
                      <select
                        {...register("channel")}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      >
                        <option value="google_ads">Google Ads</option>
                        <option value="meta_ads">Meta Ads</option>
                        <option value="linkedin_ads">LinkedIn Ads</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="seo_content">SEO Content</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Budżet (PLN)
                      </label>
                      <input
                        type="number"
                        {...register("budget", { valueAsNumber: true })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Cel biznesowy
                    </label>
                    <textarea
                      {...register("goal")}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      placeholder="np. Chcę pozyskać 50 nowych klientów na analizę umów deweloperskich..."
                    />
                    {errors.goal && (
                      <p className="text-rose-500 text-xs mt-1">
                        {errors.goal.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  disabled={isGenerating}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5 text-amber-400" />
                  )}
                  Generuj Strategię przez AI
                </button>
              </form>
            )}

            {step === 2 && aiBrief && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <header className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Twój Plan AI
                    </h3>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Edytuj dane
                  </button>
                </header>

                <div className="space-y-6">
                  {watch("channel") === "google_ads" && (
                    <section>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Podgląd w Google
                      </p>
                      <GoogleAdsPreview
                        headline={aiBrief.ad_headlines?.[0] || ""}
                        description={aiBrief.ad_descriptions?.[0] || ""}
                      />
                    </section>
                  )}

                  <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        <Zap className="w-4 h-4 text-amber-500" /> Słowa
                        Kluczowe
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(aiBrief?.keywords?.join(", ") || "")
                        }
                        className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        {copied ? "Skopiowano!" : "Kopiuj listę"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiBrief?.keywords
                        ? aiBrief.keywords
                            .slice(0, 8)
                            .map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-lg shadow-sm"
                              >
                                {kw}
                              </span>
                            ))
                        : null}
                    </div>
                  </section>

                  <section className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1 text-sm">
                      <Target className="w-4 h-4" /> Grupa Docelowa
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {aiBrief?.audience_persona ||
                        "Brak informacji o grupie docelowej."}
                    </p>
                  </section>

                  <div className="pt-2">
                    <button
                      onClick={handleLaunchAds}
                      disabled={isSaving}
                      className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-[0.98] ${
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-[#4285F4] text-white hover:bg-[#3367d6]"
                      } disabled:opacity-50`}
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin w-6 h-6" />
                      ) : (
                        <>
                          <ExternalLink className="w-6 h-6" />
                          <span>Uruchom kampanię</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({
  num,
  title,
  active,
  done,
}: {
  num: number;
  title: string;
  active: boolean;
  done: boolean;
}) => (
  <div
    className={`flex items-center gap-4 transition-all ${active ? "scale-105" : "opacity-60"}`}
  >
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 
      ${
        done
          ? "bg-emerald-500 border-emerald-500 text-white"
          : active
            ? "border-indigo-600 text-indigo-600 bg-white"
            : "border-slate-300 text-slate-400"
      }`}
    >
      {done ? <CheckCircle2 className="w-5 h-5" /> : num}
    </div>
    <span
      className={`font-bold ${active ? "text-slate-900" : "text-slate-500"}`}
    >
      {title}
    </span>
  </div>
);
