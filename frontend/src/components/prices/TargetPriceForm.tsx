import React, { useState } from "react";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { createPriceAlert } from "@/lib/priceApi";

interface TargetPriceFormProps {
  productId: string;
  productName: string;
  regionId: string;
  currencyCode: string;
  currencySymbol: string;
  currentPrice: number;
  token?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TargetPriceForm({
  productId,
  productName,
  regionId,
  currencyCode,
  currencySymbol,
  currentPrice,
  token,
  isOpen,
  onClose,
  onSuccess,
}: TargetPriceFormProps) {
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice > 0 ? (currentPrice * 0.9).toFixed(2) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to create price alerts.");
      return;
    }

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createPriceAlert(
        {
          product_id: productId,
          region_id: regionId,
          target_price: priceNum,
          currency_code: currencyCode,
        },
        token
      );

      if (res) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setError("Failed to create price alert. Please try again.");
      }
    } catch {
      setError("Network error while creating price alert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12151f] border border-[#202738] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-orange-400">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Set Target Price Alert</h3>
            <p className="text-xs text-slate-400">We will notify you when price drops below your target.</p>
          </div>
        </div>

        <div className="bg-[#0c0e17] border border-[#1d2335] rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-slate-300 truncate">{productName}</p>
          <p className="text-xs text-slate-400 mt-1">
            Current Verified Price:{" "}
            <span className="font-mono font-bold text-white">
              {currentPrice > 0 ? `${currencySymbol}${currentPrice}` : "TBA"}
            </span>
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center text-emerald-400 flex items-center justify-center gap-2 text-sm font-semibold">
            <Check className="w-5 h-5" />
            <span>Target Price Alert Created!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Price ({currencyCode})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 4999.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#0c0e17] border border-[#202738] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all"
              >
                {submitting ? "Saving..." : "Create Alert"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
