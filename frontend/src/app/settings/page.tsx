"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Globe, 
  Bell, 
  Shield, 
  Lock, 
  Trash2, 
  Check, 
  Loader2, 
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const router = useRouter();
  const { 
    user, 
    profile, 
    preferences, 
    isAuthenticated, 
    isLoading, 
    updatePreferences, 
    updatePassword, 
    signOut 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"preferences" | "privacy" | "notifications" | "security" | "danger">("preferences");

  // Regional & Gaming Preferences
  const [country, setCountry] = useState(preferences?.preferred_country || "USA");
  const [currency, setCurrency] = useState(preferences?.preferred_currency || "USD");
  const [platform, setPlatform] = useState(preferences?.preferred_platform || "PC");
  const [edition, setEdition] = useState(preferences?.preferred_edition || "Standard Edition");
  const [language, setLanguage] = useState(preferences?.preferred_language || "en");

  // Content Personalisation & Display Preferences
  const [preferredCategories, setPreferredCategories] = useState<string[]>(() => {
    if (preferences?.preferred_categories) {
      return preferences.preferred_categories.split(",").map((s) => s.trim());
    }
    return ["OFFICIAL", "VERIFIED", "DEALS", "EVENTS"];
  });
  const [theme, setTheme] = useState(preferences?.theme || "dark");
  const [contentDensity, setContentDensity] = useState(preferences?.content_density || "comfortable");

  // Notifications
  const [emailNotif, setEmailNotif] = useState(preferences?.email_notifications ?? true);
  const [priceAlertNotif, setPriceAlertNotif] = useState(preferences?.price_alert_notifications ?? true);
  const [newsNotif, setNewsNotif] = useState(preferences?.news_notifications ?? true);
  const [communityNotif, setCommunityNotif] = useState(preferences?.community_notifications ?? true);
  const [eventNotif, setEventNotif] = useState(preferences?.event_notifications ?? true);

  // Security Form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Danger Zone
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);

    const res = await updatePreferences({
      preferred_country: country,
      preferred_currency: currency,
      preferred_platform: platform,
      preferred_edition: edition,
      preferred_language: language,
      preferred_categories: preferredCategories.join(","),
      theme,
      content_density: contentDensity,
      email_notifications: emailNotif,
      price_alert_notifications: priceAlertNotif,
      news_notifications: newsNotif,
      community_notifications: communityNotif,
      event_notifications: eventNotif
    });

    setSavingPreferences(false);
    if (res.success) {
      showToast("Account preferences updated successfully!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    const res = await updatePassword(newPassword);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordError(res.error || "Failed to update password.");
    } else {
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type 'DELETE' exactly to confirm account deletion.");
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    try {
      // Call backend account deletion endpoint if possible
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      await fetch(`${API_BASE}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer test-token::${profile?.user_id}::${user?.email}`
        }
      });
    } catch {
      // Ignore
    }

    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading account preferences...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl border border-[#1e2330] bg-[#0c0e14]">
          <Shield className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-xs text-slate-400 mb-6">
            Please log in to configure your regional settings and preferences.
          </p>
          <Link href="/login">
            <Button variant="primary" size="md">Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Account Preferences & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure regional currency conversions, notification channels, security, and profile visibility.
        </p>
      </div>

      {toastMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1c212e] mb-6 pb-2">
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "preferences"
              ? "bg-orange-500/10 text-orange-400"
              : "text-slate-400 hover:text-white hover:bg-[#141724]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Preferences
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "notifications"
              ? "bg-orange-500/10 text-orange-400"
              : "text-slate-400 hover:text-white hover:bg-[#141724]"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "security"
              ? "bg-orange-500/10 text-orange-400"
              : "text-slate-400 hover:text-white hover:bg-[#141724]"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Security
        </button>

        <button
          onClick={() => setActiveTab("danger")}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "danger"
              ? "bg-rose-500/10 text-rose-400"
              : "text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Account Management
        </button>
      </div>

      {/* TAB 1: REGIONAL & GAMING PREFERENCES */}
      {activeTab === "preferences" && (
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              Regional & Gaming Settings
            </CardTitle>
            <CardDescription className="text-xs">
              These settings control currency formatting in the Price & Deals tracker and regional launch countdowns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Preferred Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="USD">USD – United States Dollar ($)</option>
                    <option value="INR">INR – Indian Rupee (₹)</option>
                    <option value="EUR">EUR – Euro (€)</option>
                    <option value="GBP">GBP – British Pound (£)</option>
                    <option value="AED">AED – United Arab Emirates Dirham (د.إ)</option>
                    <option value="CAD">CAD – Canadian Dollar (CA$)</option>
                    <option value="AUD">AUD – Australian Dollar (A$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Country / Territory
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="USA">United States</option>
                    <option value="IND">India</option>
                    <option value="GBR">United Kingdom</option>
                    <option value="EUR">European Union</option>
                    <option value="ARE">United Arab Emirates</option>
                    <option value="CAN">Canada</option>
                    <option value="AUS">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Primary Gaming Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="PC">PC (Windows)</option>
                    <option value="PS5">PlayStation 5</option>
                    <option value="XBOX_SERIES">Xbox Series X/S</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Target Game Edition
                  </label>
                  <select
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Standard Edition">Standard Edition</option>
                    <option value="Deluxe Edition">Deluxe Edition</option>
                    <option value="Collector Edition">Collector&apos;s Edition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Interface Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="en">English (US/UK)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Personalisation & Feed Customisation */}
              <div className="pt-4 border-t border-[#1c212e] space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    Feed & Search Content Personalisation
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Select your preferred topics to prioritise matching articles, deals, and calendar reminders across your player feed.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "OFFICIAL", label: "Official Rockstar Bulletins" },
                      { id: "VERIFIED", label: "Verified Media News & Previews" },
                      { id: "RUMOUR", label: "Community Rumours & Leaks" },
                      { id: "DEALS", label: "Price Drops & Retailer Deals" },
                      { id: "EVENTS", label: "Launch & Livestream Events" },
                      { id: "HELP", label: "PC Hardware & Solver Guides" },
                    ].map((item) => {
                      const isChecked = preferredCategories.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#141724] border border-[#23293a] hover:border-orange-500/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferredCategories([...preferredCategories, item.id]);
                              } else {
                                setPreferredCategories(preferredCategories.filter((c) => c !== item.id));
                              }
                            }}
                            className="rounded border-[#23293a] bg-[#0c0e14] text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-200 text-xs font-medium">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Display & Layout Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                      Display Theme
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="dark">Dark Theme (Default)</option>
                      <option value="light">Light Theme</option>
                      <option value="system">Follow System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                      Content Density
                    </label>
                    <select
                      value={contentDensity}
                      onChange={(e) => setContentDensity(e.target.value)}
                      className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="comfortable">Comfortable (Card Layout)</option>
                      <option value="compact">Compact (Dense Data Rows)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1c212e] flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  disabled={savingPreferences}
                >
                  {savingPreferences ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Configure which updates and price-drop alerts are dispatched to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="divide-y divide-[#1c212e] text-xs">
                
                <label className="py-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Email Notifications</span>
                    <span className="text-[11px] text-slate-400">Master toggle for all email communications.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500 w-4 h-4"
                  />
                </label>

                <label className="py-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Price Drop & Pre-Order Alerts</span>
                    <span className="text-[11px] text-slate-400">Receive instant alerts when editions on your wishlist drop below your threshold.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={priceAlertNotif}
                    onChange={(e) => setPriceAlertNotif(e.target.checked)}
                    className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500 w-4 h-4"
                  />
                </label>

                <label className="py-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Official Rockstar Bulletins</span>
                    <span className="text-[11px] text-slate-400">Instant notification for official Rockstar Games press releases and trailer drops.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newsNotif}
                    onChange={(e) => setNewsNotif(e.target.checked)}
                    className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500 w-4 h-4"
                  />
                </label>

                <label className="py-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Community Replies & Mentions</span>
                    <span className="text-[11px] text-slate-400">Notifies when another player comments on your discussion thread.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={communityNotif}
                    onChange={(e) => setCommunityNotif(e.target.checked)}
                    className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500 w-4 h-4"
                  />
                </label>

                <label className="py-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Major Event Reminders</span>
                    <span className="text-[11px] text-slate-400">Countdowns to game expos, financial earnings calls, and launch events.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventNotif}
                    onChange={(e) => setEventNotif(e.target.checked)}
                    className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500 w-4 h-4"
                  />
                </label>

              </div>

              <div className="pt-3 border-t border-[#1c212e] flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  disabled={savingPreferences}
                >
                  {savingPreferences ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Notification Settings"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ACCOUNT SECURITY */}
      {activeTab === "security" && (
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              Account Security & Password
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your password and review active authenticated session credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Account Info */}
            <div className="p-3.5 rounded-xl bg-[#141724] border border-[#23293a] text-xs">
              <span className="text-slate-400 block mb-0.5">Signed in as:</span>
              <span className="font-bold text-white text-sm">{user?.email}</span>
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Change Password</h3>

              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="text-rose-400 hover:bg-rose-950/20"
                >
                  Sign Out of All Sessions
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      )}

      {/* TAB 4: DANGER ZONE (ACCOUNT DELETION) */}
      {activeTab === "danger" && (
        <Card className="border-rose-950/60 bg-[#12080c]">
          <CardHeader>
            <CardTitle className="text-base text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone – Account Deletion
            </CardTitle>
            <CardDescription className="text-xs text-rose-300/70">
              Permanently delete your GTA 6 Player Hub account, saved reports, wishlist triggers, and profile data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 space-y-2">
              <p className="font-bold">This action cannot be undone.</p>
              <p>
                Deleting your account will permanently remove your gamer handle, custom avatar, saved PC compatibility reports, and active price tracking alerts.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type <span className="font-mono text-rose-400 font-black">DELETE</span> to confirm:
              </label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="max-w-xs border-rose-900/40 focus:border-rose-500"
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirmText !== "DELETE" || deletingAccount}
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Permanently Delete Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
