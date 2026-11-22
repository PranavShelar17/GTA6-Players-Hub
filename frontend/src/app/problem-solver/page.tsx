import React from "react";
import { Metadata } from "next";
import { fetchAIServiceStatus, fetchSuggestedCategories } from "@/lib/problemSolverApi";
import { ProblemSolverClient } from "@/components/problem-solver/ProblemSolverClient";

export const metadata: Metadata = {
  title: "AI Gaming Problem Solver | GTA 6 Player Hub",
  description:
    "AI-assisted technical diagnostics, error code troubleshooting, safe GPU driver installation guides, and hardware performance resolution for GTA 6 and PC gaming.",
  keywords: [
    "GTA 6 error codes",
    "PC gaming crash fix",
    "DirectX 12 launch crash",
    "DDU clean driver reinstall",
    "AI gaming problem solver",
    "Rockstar Games launcher troubleshooting",
    "GPU stutter fix",
    "DualSense controller PC support",
  ],
};

export default async function ProblemSolverPage() {
  // Fetch initial AI service status & suggested categories serverside
  const [status, categories] = await Promise.all([
    fetchAIServiceStatus(),
    fetchSuggestedCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#07090e]">
      <ProblemSolverClient
        initialStatus={status}
        initialCategories={categories}
      />
    </div>
  );
}
