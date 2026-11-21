"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    // Simulate resend countdown
    setTimeout(() => {
      setResending(false);
      setResent(true);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black">Check Your Inbox</CardTitle>
          <CardDescription>
            We have dispatched an email confirmation message to your address.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-[#141724] border border-[#23293a] text-center">
            <span className="text-slate-400 block mb-0.5">Verification sent to:</span>
            <span className="text-sm font-bold text-white">{user?.email || "your registered email"}</span>
          </div>

          <p>
            Click the secure link in the email to verify your address and gain full access to player discussions, price alerts, and saved hardware reports.
          </p>

          {resent && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>A new verification link has been sent.</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Resend Verification Link"
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-[#1c212e] pt-4">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-orange-400 hover:underline">
            Back to Sign In
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
