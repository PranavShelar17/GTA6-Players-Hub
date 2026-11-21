import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="p-6 rounded-2xl border border-[#1e2330] bg-[#12141c] flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white text-2xl font-black">
          VP
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-black text-white">ViceCityPilot</h1>
            <Badge variant="verified">Verified Gamer</Badge>
          </div>
          <p className="text-xs text-slate-400 mb-3">Joined: Nov 2026 • Preferred Platform: PlayStation 5 • Region: India</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Link href="/settings">
              <Button variant="secondary" size="sm">Edit Preferences</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 mb-6">
        <strong>Phase 1 Shell:</strong> Player profile editing, badge progression, and follower connections will be fully operational in Phase 2.
      </div>
    </div>
  );
}
