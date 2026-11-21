"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError(null);
    await resetPassword(email);
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Reset Password</CardTitle>
          <CardDescription>
            Enter your registered email to receive a secure password recovery link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-white">Recovery Instructions Sent</p>
                <p>
                  If an account exists with <span className="text-white font-medium">{email}</span>, you will receive an email shortly with a secure link to reset your password.
                </p>
                <p className="text-slate-400">
                  For your security, links expire after 60 minutes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setSubmitted(false)}
              >
                Send to a different email
              </Button>
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
                  Registered Email Address
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
                    Sending Instructions...
                  </>
                ) : (
                  "Send Recovery Link"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-[#1c212e] pt-4">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
