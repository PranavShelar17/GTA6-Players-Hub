import React from "react";
import { Metadata } from "next";
import { fetchRequirementsStatus, fetchSystemRequirements } from "@/lib/pcCompatibilityApi";
import { PCCompatibilityClient } from "@/components/pc-compatibility/PCCompatibilityClient";

export const metadata: Metadata = {
  title: "PC Compatibility Checker | GTA 6 Player Hub",
  description:
    "Evaluate your PC hardware specifications against verified requirements, identify component balance bottlenecks, and review hardware upgrade guidance for GTA 6.",
  keywords: [
    "GTA 6 PC requirements",
    "Grand Theft Auto VI system requirements",
    "PC compatibility checker",
    "GTA 6 PC specs",
    "hardware bottleneck analysis",
    "gaming PC upgrade guidance",
  ],
};

export default async function PcCompatibilityPage() {
  // Fetch initial status and requirements serverside
  const [statusData, requirements] = await Promise.all([
    fetchRequirementsStatus(),
    fetchSystemRequirements(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PCCompatibilityClient
        initialStatus={statusData}
        initialRequirements={requirements}
      />
    </div>
  );
}
