"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameValid) {
      setError("Username must be 3-30 characters with letters, numbers, and underscores only.");
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("Password must be at least 8 characters and include at least one letter and one number.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, username, displayName || username);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Registration failed. Please check your information.");
      return;
    }

    if (result.needsVerification) {
      setVerificationRequired(true);
    } else {
      router.push("/dashboard");
    }
  };

  if (verificationRequired) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black">Verify Your Email</CardTitle>
            <CardDescription className="text-xs">
              We have dispatched a verification link to <span className="text-white font-semibold">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-300">
            <p>
              Please open the link in your email to verify your account and activate your GTA 6 Player Hub profile.
            </p>
            <div className="p-3 rounded-lg bg-[#141724] border border-[#23293a] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Didn&apos;t receive the email?</p>
              Check your spam folder or wait a few minutes before requesting a new link.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button variant="primary" size="md" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Create Player Account</CardTitle>
          <CardDescription>
            Join GTA 6 Player Hub to save hardware specs, track deals, and connect.
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
                Gamer Username *
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. ViceCityLegend"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                {username.length >= 3 && (
                  <span className="absolute right-3 top-2.5 text-xs">
                    {usernameValid ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">3–30 characters, letters, numbers, and underscores.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Display Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Alex Vance"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Email Address *
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Password *
              </label>
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
              
              {/* Password strength checklist */}
              <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-400" : "bg-slate-600"}`} />
                  8+ chars
                </span>
                <span className={`flex items-center gap-1 ${hasLetter ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasLetter ? "bg-emerald-400" : "bg-slate-600"}`} />
                  1 letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-400" : "bg-slate-600"}`} />
                  1 number
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Confirm Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#23293a] bg-[#141724] text-orange-500 focus:ring-orange-500"
                />
                <span>
                  I agree to the <Link href="/community" className="text-orange-400 hover:underline">Community Guidelines</Link> and <span className="text-orange-400 hover:underline">Privacy Policy</span>.
                </span>
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
                  Creating Account...
                </>
              ) : (
                <>
                  Register as Player
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-[#1c212e] pt-4">
          <span>Already registered? </span>
          <Link href="/login" className="text-orange-400 hover:underline font-semibold ml-1">
            Sign In here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
