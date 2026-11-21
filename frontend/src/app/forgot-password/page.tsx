import React from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password recovery link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Registered Email
            </label>
            <Input type="email" placeholder="player@example.com" />
          </div>

          <Button variant="primary" size="md" className="w-full">
            Send Reset Instructions (Phase 2)
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400">
          <Link href="/login" className="inline-flex items-center gap-1 text-slate-300 hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
