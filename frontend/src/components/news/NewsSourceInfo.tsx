import React from "react";
import { ExternalLink, ShieldCheck, Info } from "lucide-react";

interface NewsSourceInfoProps {
  sourceName: string;
  sourceUrl: string;
  originalArticleUrl: string;
  verificationStatus: string;
  publishedAt: string;
}

export function NewsSourceInfo({
  sourceName,
  sourceUrl,
  originalArticleUrl,
  verificationStatus,
  publishedAt,
}: NewsSourceInfoProps) {
  const formattedDate = (() => {
    try {
      return new Date(publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return publishedAt;
    }
  })();

  return (
    <div className="rounded-xl border border-[#1e2330] bg-[#10121a] p-4 text-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c212e] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="font-bold text-white">Source Citation & Verification Policy</span>
        </div>
        <span className="text-slate-400">Original Publication: {formattedDate}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
        <div>
          <span className="text-slate-500 block mb-0.5">Reporting Publisher</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1"
          >
            {sourceName}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Direct Source Material</span>
          <a
            href={originalArticleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 break-all"
          >
            <span>View Original Reference</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>

      <div className="pt-2 border-t border-[#191d29] flex items-start gap-2 text-slate-400 text-[11px] leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Editorial Integrity:</strong> GTA 6 Player Hub is an independent gaming platform. We do not duplicate complete external copyrighted prose; articles are concise analytical summaries with transparent attribution. Verification Tier: <strong className="text-white">{verificationStatus}</strong>.
        </span>
      </div>
    </div>
  );
}
