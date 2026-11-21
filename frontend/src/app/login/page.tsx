"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Player Sign In</CardTitle>
          <CardDescription>
            Access your personalized GTA 6 Player Hub dashboard.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Input 
                  type="email" 
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-orange-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500"
                />
                <span>Remember session</span>
              </label>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Player Hub
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-[#1c212e] pt-4">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="text-orange-400 hover:underline font-semibold ml-1">
            Register as a Player
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
