"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  Edit3, 
  Camera, 
  Trash2, 
  Check, 
  X, 
  Globe, 
  Gamepad2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Calendar, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const { profile, isAuthenticated, isLoading, updateProfile, uploadAvatar, removeAvatar } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [countryCode, setCountryCode] = useState(profile?.country_code || "USA");
  const [platform, setPlatform] = useState(profile?.preferred_platform || "PC");
  const [visibility, setVisibility] = useState<"public" | "private">(profile?.profile_visibility || "public");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when entering edit mode
  const handleStartEdit = () => {
    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setBio(profile.bio || "");
      setCountryCode(profile.country_code || "USA");
      setPlatform(profile.preferred_platform || "PC");
      setVisibility(profile.profile_visibility || "public");
    }
    setProfileError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);

    const res = await updateProfile({
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      country_code: countryCode,
      preferred_platform: platform,
      profile_visibility: visibility
    });

    setSaving(false);
    if (!res.success) {
      setProfileError(res.error || "Failed to update profile.");
      return;
    }

    setSuccessMessage("Player profile updated successfully!");
    setIsEditing(false);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setUploadingAvatar(true);
    const res = await uploadAvatar(file);
    setUploadingAvatar(false);

    if (!res.success) {
      setAvatarError(res.error || "Failed to upload avatar image.");
    } else {
      setSuccessMessage("Avatar image updated!");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setUploadingAvatar(true);
    await removeAvatar();
    setUploadingAvatar(false);
    setSuccessMessage("Avatar reset to default.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading player profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl border border-[#1e2330] bg-[#0c0e14]">
          <User className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-xs text-slate-400 mb-6">
            You must be logged in to view and manage your player profile.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/login">
              <Button variant="primary" size="md">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="md">Register</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile.display_name || profile.username).slice(0, 2).toUpperCase();
  const joinedDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Nov 2026";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Toast notifications */}
      {successMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {avatarError && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{avatarError}</span>
        </div>
      )}

      {/* Profile Header Hero */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#1e2330] bg-gradient-to-r from-[#12141c] to-[#0d0f17] flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative">
        
        {/* Avatar Container with Upload Actions */}
        <div className="relative group shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-500/50 shadow-lg shadow-orange-500/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/10 border-2 border-orange-500/30">
              {initials}
            </div>
          )}

          {/* Quick upload trigger overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-semibold transition-opacity"
            title="Upload new avatar"
          >
            {uploadingAvatar ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 mb-1 text-orange-400" />
                Change
              </>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
              {profile.display_name}
            </h1>
            {profile.is_verified && (
              <Badge variant="verified">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Gamer
              </Badge>
            )}
            <Badge variant="outline" className="text-[11px] capitalize">
              {profile.profile_visibility === "public" ? (
                <><Eye className="w-3 h-3 mr-1 text-emerald-400" /> Public</>
              ) : (
                <><EyeOff className="w-3 h-3 mr-1 text-slate-400" /> Private</>
              )}
            </Badge>
          </div>

          <p className="text-xs text-orange-400 font-medium mb-2">@{profile.username}</p>

          {profile.bio && (
            <p className="text-xs text-slate-300 max-w-xl mb-3 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Meta specs */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              Platform: <strong className="text-white">{profile.preferred_platform}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              Region: <strong className="text-white">{profile.country_code || "Global"}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member Since: <strong className="text-white">{joinedDate}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex sm:flex-col gap-2 shrink-0">
          {!isEditing ? (
            <Button variant="secondary" size="sm" onClick={handleStartEdit} className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          ) : null}
          {profile.avatar_url && !isEditing && (
            <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-slate-400 hover:text-rose-400 gap-1.5 text-xs">
              <Trash2 className="w-3 h-3" />
              Remove Photo
            </Button>
          )}
        </div>
      </div>

      {/* Edit Profile Form Card */}
      {isEditing && (
        <Card className="border-[#1e2330] bg-[#0c0e14] mb-8">
          <CardHeader className="pb-3 border-b border-[#1c212e]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Edit Player Profile</CardTitle>
              <button 
                onClick={handleCancelEdit} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Display Name
                  </label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Username (@)
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">3–30 letters, numbers, and underscores.</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Player Bio
                  </label>
                  <span className="text-[11px] text-slate-400">{bio.length}/500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Tell other GTA 6 players about your gaming background and platform setup..."
                  className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Country / Region
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="USA">United States (USA)</option>
                    <option value="IND">India (IND)</option>
                    <option value="GBR">United Kingdom (GBR)</option>
                    <option value="EUR">European Union (EUR)</option>
                    <option value="ARE">United Arab Emirates (ARE)</option>
                    <option value="CAN">Canada (CAN)</option>
                    <option value="AUS">Australia (AUS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Preferred Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="PC">PC</option>
                    <option value="PS5">PlayStation 5</option>
                    <option value="XBOX_SERIES">Xbox Series X/S</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Profile Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                    className="w-full rounded-lg bg-[#141724] border border-[#23293a] px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="public">Public (Visible on community)</option>
                    <option value="private">Private (Only visible to you)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1c212e]">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Profile Sections & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-orange-400" />
              Gaming Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-[#1c212e]">
              <span className="text-slate-400">Reputation Score</span>
              <span className="font-bold text-orange-400">{profile.reputation_score} pts</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1c212e]">
              <span className="text-slate-400">Account Status</span>
              <span className="font-bold text-emerald-400">Active & Verified</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Preferred Platform</span>
              <span className="font-bold text-white">{profile.preferred_platform}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <p className="text-slate-400">
              Manage your regional currency conversions, price alert triggers, notification channels, and privacy settings.
            </p>
            <Link href="/settings" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full">
                Go to Account Settings →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
