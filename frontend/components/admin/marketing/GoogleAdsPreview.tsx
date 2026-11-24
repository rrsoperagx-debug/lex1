/**
 * ============================================================================
 * LexPortal - Komponent: Podgląd Reklamy Google Ads
 * ============================================================================
 *
 * Opis:
 * Ten komponent (`GoogleAdsPreview`) jest wizualnym "mockupem" reklamy
 * w wyszukiwarce Google. Jego celem jest natychmiastowe zwizualizowanie
 * użytkownikowi, jak będą wyglądać nagłówek i opis reklamy wygenerowane
 * przez AI.
 *
 * Rola w module marketingowym:
 * - Stanowi kluczowy element UX w `NewCampaignModal`, dając użytkownikowi
 *   realistyczny podgląd efektów pracy AI.
 * - Pomaga w ocenie jakości wygenerowanych treści reklamowych w kontekście,
 *   w którym finalnie się pojawią.
 * - Używa specyficznych dla Google kolorów i stylistyki, aby zwiększyć
 *   realizm podglądu.
 *
 * Props:
 * - `headline`: Nagłówek reklamy (wygenerowany przez AI).
 * - `description`: Opis reklamy (wygenerowany przez AI).
 *
 * ============================================================================
 */
import React from "react";

interface GoogleAdsPreviewProps {
  headline: string;
  description: string;
}

export const GoogleAdsPreview: React.FC<GoogleAdsPreviewProps> = ({
  headline,
  description,
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-inner">
    <div className="flex items-center gap-2 mb-2">
      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
        Sponsorowane
      </span>
      <span className="text-xs text-slate-500">www.lexportal.pl</span>
    </div>
    <h4 className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer leading-tight mb-1">
      {headline || "Twój profesjonalny nagłówek pojawi się tutaj"}
    </h4>
    <p className="text-[#4d5156] text-sm leading-relaxed">
      {description ||
        "Opis kampanii wygenerowany przez AI pomoże Ci przyciągnąć klientów szukających pomocy prawnej online."}
    </p>
  </div>
);
