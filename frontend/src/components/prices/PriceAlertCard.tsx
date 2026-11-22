import React from "react";
import { Bell, Trash2, CheckCircle2 } from "lucide-react";
import { PriceAlertItem } from "@/lib/priceApi";

interface PriceAlertCardProps {
  alert: PriceAlertItem;
  onDelete: (alertId: string) => void;
}

export function PriceAlertCard({ alert, onDelete }: PriceAlertCardProps) {
  return (
    <div className="bg-[#12151f] border border-[#202738] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            {alert.platform}
          </span>
          <span className="text-xs text-slate-400 uppercase font-semibold">
            {alert.edition}
          </span>
        </div>
        <h4 className="text-sm font-bold text-white">{alert.product_name}</h4>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>
            Target: <strong className="text-white font-mono">{alert.currency_code} {alert.target_price}</strong>
          </span>
          {alert.current_verified_price && (
            <span>
              Current: <span className="font-mono text-slate-300">{alert.currency_code} {alert.current_verified_price}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        {alert.is_target_met ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Target Met!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Bell className="w-3.5 h-3.5 text-orange-400" />
            Monitoring
          </span>
        )}

        <button
          onClick={() => onDelete(alert.id)}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          title="Delete price alert"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
