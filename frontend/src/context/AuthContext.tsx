"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export interface PlayerProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  country_code?: string | null;
  preferred_platform: string;
  preferred_language: string;
  profile_visibility: "public" | "private";
  reputation_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PlayerPreferences {
  id: string;
  user_id: string;
  preferred_country: string;
  preferred_currency: string;
  preferred_platform: string;
  preferred_edition: string;
  preferred_language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  community_notifications: boolean;
  news_notifications: boolean;
  price_alert_notifications: boolean;
  event_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: PlayerProfile | null;
  preferences: PlayerPreferences | null;
  activities: PlayerActivity[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<PlayerProfile>) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (data: Partial<PlayerPreferences>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  removeAvatar: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Default demo player state for fallback when Supabase is unconfigured
const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";
const DEFAULT_PROFILE: PlayerProfile = {
  id: DEMO_USER_ID,
  user_id: DEMO_USER_ID,
  username: "ViceCityPilot",
  display_name: "Vice City Pilot",
  avatar_url: null,
  bio: "Grand Theft Auto veteran since 2002. Exploring Leonida and counting down to launch day.",
  country_code: "USA",
  preferred_platform: "PS5",
  preferred_language: "en",
  profile_visibility: "public",
  reputation_score: 120,
  is_verified: true,
  created_at: new Date().toISOString()
};

const DEFAULT_PREFERENCES: PlayerPreferences = {
  id: DEMO_USER_ID,
  user_id: DEMO_USER_ID,
  preferred_country: "USA",
  preferred_currency: "USD",
  preferred_platform: "PS5",
  preferred_edition: "Standard Edition",
  preferred_language: "en",
  email_notifications: true,
  push_notifications: false,
  community_notifications: true,
  news_notifications: true,
  price_alert_notifications: true,
  event_notifications: true
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [preferences, setPreferences] = useState<PlayerPreferences | null>(null);
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile and preferences with FastAPI backend
  const fetchBackendPlayerData = useCallback(async (token: string, currentUser: User) => {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setProfile(payload.data.profile);
          setPreferences(payload.data.preferences);
          setActivities(payload.data.recent_activities || []);
          return;
        }
      }
    } catch {
      // Backend may be starting or offline
    }

    // Fallback profile if backend is not yet populated
    setProfile((prev) => prev || {
      id: currentUser.id,
      user_id: currentUser.id,
      username: (currentUser.user_metadata?.username as string) || `Player_${currentUser.id.slice(0, 8)}`,
      display_name: (currentUser.user_metadata?.display_name as string) || (currentUser.user_metadata?.full_name as string) || "Gamer",
      avatar_url: null,
      bio: null,
      country_code: "USA",
      preferred_platform: "PC",
      preferred_language: "en",
      profile_visibility: "public",
      reputation_score: 10,
      is_verified: false,
      created_at: currentUser.created_at
    });

    setPreferences((prev) => prev || {
      id: currentUser.id,
      user_id: currentUser.id,
      preferred_country: "USA",
      preferred_currency: "USD",
      preferred_platform: "PC",
      preferred_edition: "Standard Edition",
      preferred_language: "en",
      email_notifications: true,
      push_notifications: false,
      community_notifications: true,
      news_notifications: true,
      price_alert_notifications: true,
      event_notifications: true
    });
  }, []);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchBackendPlayerData(currentSession.access_token, currentSession.user);
        } else {
          // Check local storage for persistent guest/demo test session if Supabase is placeholder
          const localStoredUser = typeof window !== "undefined" ? localStorage.getItem("gta6_mock_user") : null;
          if (localStoredUser) {
            try {
              const parsed = JSON.parse(localStoredUser);
              setUser(parsed.user);
              setProfile(parsed.profile);
              setPreferences(parsed.preferences);
            } catch {
              localStorage.removeItem("gta6_mock_user");
            }
          }
        }
      } catch (err) {
        console.warn("Auth initialization note:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchBackendPlayerData(newSession.access_token, newSession.user);
        } else {
          setProfile(null);
          setPreferences(null);
          setActivities([]);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchBackendPlayerData]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder-project");
      
      if (!isPlaceholder) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: "Invalid email or password." };
        }
        if (data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          await fetchBackendPlayerData(data.session.access_token, data.user);
          setIsLoading(false);
          return { success: true };
        }
      }

      // Safe Demo / Local Testing fallback mode
      const mockUser: User = {
        id: DEMO_USER_ID,
        app_metadata: {},
        user_metadata: { username: "ViceCityPilot", display_name: "Vice City Pilot" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: email,
        phone: "",
        role: "authenticated",
        updated_at: new Date().toISOString()
      };
      setUser(mockUser);
      setProfile(DEFAULT_PROFILE);
      setPreferences(DEFAULT_PREFERENCES);
      if (typeof window !== "undefined") {
        localStorage.setItem("gta6_mock_user", JSON.stringify({
          user: mockUser,
          profile: DEFAULT_PROFILE,
          preferences: DEFAULT_PREFERENCES
        }));
      }
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred during sign in." };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    setIsLoading(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder-project");

      if (!isPlaceholder) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              display_name: displayName.trim(),
            },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined
          }
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        // If email confirmation is required by Supabase
        if (data.user && !data.session) {
          setIsLoading(false);
          return { success: true, needsVerification: true };
        }

        if (data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          await fetchBackendPlayerData(data.session.access_token, data.user);
        }

        setIsLoading(false);
        return { success: true };
      }

      // Safe Demo / Local Testing fallback mode
      const newUserId = "user-" + Math.random().toString(36).substring(2, 10);
      const mockUser: User = {
        id: newUserId,
        app_metadata: {},
        user_metadata: { username: username.trim(), display_name: displayName.trim() },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: email,
        phone: "",
        role: "authenticated",
        updated_at: new Date().toISOString()
      };
      const newProfile: PlayerProfile = {
        id: newUserId,
        user_id: newUserId,
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_url: null,
        bio: null,
        country_code: "USA",
        preferred_platform: "PC",
        preferred_language: "en",
        profile_visibility: "public",
        reputation_score: 10,
        is_verified: false,
        created_at: new Date().toISOString()
      };
      const newPrefs: PlayerPreferences = {
        ...DEFAULT_PREFERENCES,
        id: newUserId,
        user_id: newUserId
      };

      setUser(mockUser);
      setProfile(newProfile);
      setPreferences(newPrefs);
      if (typeof window !== "undefined") {
        localStorage.setItem("gta6_mock_user", JSON.stringify({
          user: mockUser,
          profile: newProfile,
          preferences: newPrefs
        }));
      }

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred during registration." };
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setPreferences(null);
      setActivities([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("gta6_mock_user");
      }
      setIsLoading(false);
    }
  };

  // Reset Password Request
  const resetPassword = async (email: string) => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder-project");
      if (!isPlaceholder) {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
        });
      }
      return { success: true };
    } catch {
      return { success: true }; // Do not disclose whether email exists
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || "Failed to update password." };
    }
  };

  // Update Profile
  const updateProfile = async (data: Partial<PlayerProfile>) => {
    if (!profile) return { success: false, error: "Not authenticated" };

    try {
      const token = session?.access_token || `test-token::${profile.user_id}::${user?.email || "player@example.com"}`;
      const res = await fetch(`${API_BASE}/users/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setProfile(payload.data);
          return { success: true };
        }
      } else if (res.status === 409) {
        return { success: false, error: "Username is already claimed by another player." };
      }
    } catch {
      // Fallback update
    }

    // Local optimistic update
    const updated = { ...profile, ...data };
    setProfile(updated);
    if (typeof window !== "undefined" && localStorage.getItem("gta6_mock_user")) {
      localStorage.setItem("gta6_mock_user", JSON.stringify({ user, profile: updated, preferences }));
    }
    return { success: true };
  };

  // Update Preferences
  const updatePreferences = async (data: Partial<PlayerPreferences>) => {
    if (!preferences) return { success: false, error: "Not authenticated" };

    try {
      const token = session?.access_token || `test-token::${preferences.user_id}::${user?.email || "player@example.com"}`;
      const res = await fetch(`${API_BASE}/users/me/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setPreferences(payload.data);
          return { success: true };
        }
      }
    } catch {
      // Fallback
    }

    const updated = { ...preferences, ...data };
    setPreferences(updated);
    if (typeof window !== "undefined" && localStorage.getItem("gta6_mock_user")) {
      localStorage.setItem("gta6_mock_user", JSON.stringify({ user, profile, preferences: updated }));
    }
    return { success: true };
  };

  // Upload Avatar
  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: "Not authenticated" };

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, WEBP, or GIF images are allowed." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "Image size must not exceed 2 MB." };
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = session?.access_token || `test-token::${profile.user_id}::${user?.email || "player@example.com"}`;

      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setProfile(payload.data);
          return { success: true };
        }
      }
    } catch {
      // Fallback to local Data URL
    }

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        const updated = { ...profile, avatar_url: base64Url };
        setProfile(updated);
        if (typeof window !== "undefined" && localStorage.getItem("gta6_mock_user")) {
          localStorage.setItem("gta6_mock_user", JSON.stringify({ user, profile: updated, preferences }));
        }
        resolve({ success: true });
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Avatar
  const removeAvatar = async () => {
    if (!profile) return { success: false, error: "Not authenticated" };

    try {
      const token = session?.access_token || `test-token::${profile.user_id}::${user?.email || "player@example.com"}`;
      await fetch(`${API_BASE}/users/me/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Fallback
    }

    const updated = { ...profile, avatar_url: null };
    setProfile(updated);
    if (typeof window !== "undefined" && localStorage.getItem("gta6_mock_user")) {
      localStorage.setItem("gta6_mock_user", JSON.stringify({ user, profile: updated, preferences }));
    }
    return { success: true };
  };

  // Refresh Profile
  const refreshProfile = async () => {
    if (session?.access_token && user) {
      await fetchBackendPlayerData(session.access_token, user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        preferences,
        activities,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        updatePreferences,
        uploadAvatar,
        removeAvatar,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
