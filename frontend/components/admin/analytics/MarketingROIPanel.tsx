import React from "react";
import { TrendingUp, TrendingDown, Target, ArrowUpRight } from "lucide-react";

export interface CampaignROI {
  campaign: string;
  channel: string;
  cost: number;
  revenue: number;
  roi: number;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    val,
  );

export const MarketingROIPanel: React.FC<{ data: CampaignROI[] }> = ({
  data,
}) => {
  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Efektywność Kampanii
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Zwrot z inwestycji (ROI) w podziale na kanały
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest">
          Ostatnie 30 dni
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-6 text-xs font-bold uppercase text-slate-400 tracking-widest">
                Kampania
              </th>
              <th className="p-6 text-xs font-bold uppercase text-slate-400 tracking-widest text-right">
                Koszt
              </th>
              <th className="p-6 text-xs font-bold uppercase text-slate-400 tracking-widest text-right">
                Przychód
              </th>
              <th className="p-6 text-xs font-bold uppercase text-slate-400 tracking-widest text-center">
                Wskaźnik ROI
              </th>
              <th className="p-6 text-xs font-bold uppercase text-slate-400 tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/30 transition-colors group"
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Target className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {item.campaign}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {item.channel.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-right font-medium text-slate-600">
                  {formatCurrency(item.cost)}
                </td>
                <td className="p-6 text-right">
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(item.revenue)}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-lg font-black ${item.roi >= 2 ? "text-emerald-500" : item.roi >= 1 ? "text-amber-500" : "text-rose-500"}`}
                    >
                      {item.roi.toFixed(2)}x
                    </span>
                    <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.roi >= 1 ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(item.roi * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  {item.roi >= 1.5 ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-tighter">
                      <TrendingUp className="w-4 h-4" /> Skaluj
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                      <TrendingDown className="w-4 h-4" /> Optymalizuj
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-50/50 text-center">
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 mx-auto">
          Pobierz pełny raport finansowy <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
