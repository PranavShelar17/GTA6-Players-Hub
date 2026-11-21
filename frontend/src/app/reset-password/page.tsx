"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("Password must be at least 8 characters and include at least one letter and one number.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to update password. Recovery link may have expired.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Set New Password</CardTitle>
          <CardDescription>
            Choose a strong, secure password for your GTA 6 Player Hub account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Password Updated Successfully</p>
              <p className="text-xs text-slate-300">
                You can now log in using your new credentials.
              </p>
              <Link href="/login" className="block w-full pt-2">
                <Button variant="primary" size="md" className="w-full gap-2">
                  Proceed to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  New Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
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
                  Confirm New Password
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

              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  "Save New Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-[#1c212e] pt-4">
          <Link href="/login" className="text-orange-400 hover:underline">
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
