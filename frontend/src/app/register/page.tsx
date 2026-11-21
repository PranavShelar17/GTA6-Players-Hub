import React from "react";
import Link from "next/link";
import { User, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="border-[#1e2330]">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-black">Create Player Account</CardTitle>
          <CardDescription>
            Join the GTA 6 Player Hub community and save your hardware reports.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Phase 1 Shell: User registration, email verification, and Argon2id password security activate in Phase 2.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Gamer Username
            </label>
            <Input placeholder="ViceCityExplorer" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Email Address
            </label>
            <Input type="email" placeholder="player@example.com" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Password
            </label>
            <Input type="password" placeholder="Minimum 8 characters" />
          </div>

          <Button variant="primary" size="md" className="w-full gap-2">
            Register Account (Phase 2 Preview)
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400">
          <span>Already registered? </span>
          <Link href="/login" className="text-orange-400 hover:underline font-semibold ml-1">
            Sign In here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
