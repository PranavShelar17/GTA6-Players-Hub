import React from "react";
import { Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Account Preferences & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure your notification preferences, regional currency, and theme settings.</p>
      </div>

      <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 mb-6">
        <strong>Phase 1 Shell:</strong> Account settings management connects to the Supabase database in Phase 2.
      </div>

      <div className="space-y-6">
        <Card className="border-[#1e2330]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              Regional & Platform Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-300">
            <div>
              <label className="block font-semibold mb-1">Preferred Currency</label>
              <select defaultValue="INR" className="rounded-lg bg-[#141722] border border-[#232938] px-3 py-2 text-white">
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Primary Gaming Platform</label>
              <select defaultValue="PS5" className="rounded-lg bg-[#141722] border border-[#232938] px-3 py-2 text-white">
                <option value="PS5">PlayStation 5</option>
                <option value="XBOX">Xbox Series X/S</option>
                <option value="PC">PC</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
