import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Cpu, 
  Wrench, 
  Tag, 
  Users, 
  Newspaper, 
  Flame 
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PlatformPillarsSection() {
  const pillars = [
    {
      title: "News & Updates",
      desc: "Official Rockstar Newswire bulletins, verified press reports, trailer analyses, and strict 4-tier labeling.",
      icon: Newspaper,
      href: "/news",
      color: "text-orange-400 bg-orange-500/10",
      hoverBorder: "hover:border-orange-500/50",
    },
    {
      title: "PC Compatibility",
      desc: "Hardware spec builder, bottleneck analysis, upgrade recommendations, and unconfirmed requirement alerts.",
      icon: Cpu,
      href: "/pc-compatibility",
      color: "text-rose-400 bg-rose-500/10",
      hoverBorder: "hover:border-rose-500/50",
    },
    {
      title: "Price & Deals Tracker",
      desc: "Worldwide pre-order intelligence, INR conversion, verified retailers, price history, and drop alerts.",
      icon: Tag,
      href: "/price-deals",
      color: "text-amber-400 bg-amber-500/10",
      hoverBorder: "hover:border-amber-500/50",
    },
    {
      title: "Gaming Problem Solver",
      desc: "AI technical troubleshooter, known error encyclopedia, safe driver guides, and step-by-step checklists.",
      icon: Wrench,
      href: "/problem-solver",
      color: "text-sky-400 bg-sky-500/10",
      hoverBorder: "hover:border-sky-500/50",
    },
    {
      title: "Gaming Community",
      desc: "Player discussions, group hubs, verified polls, media sharing, and safe community moderation.",
      icon: Users,
      href: "/community",
      color: "text-purple-400 bg-purple-500/10",
      hoverBorder: "hover:border-purple-500/50",
    },
    {
      title: "Player Dashboard",
      desc: "Personalized player hub: saved PC reports, active price alerts, bookmarked articles, and preferences.",
      icon: Flame,
      href: "/dashboard",
      color: "text-emerald-400 bg-emerald-500/10",
      hoverBorder: "hover:border-emerald-500/50",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <SectionHeader
        tag="Platform Pillars"
        title="Explore GTA 6 Player Hub"
        subtitle="Navigate directly to the six primary services engineered for players."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pillars.map((pillar) => (
          <Link key={pillar.title} href={pillar.href} className="group">
            <Card className={`h-full border-[#1e2330] ${pillar.hoverBorder} transition-all duration-200`}>
              <div className={`p-2.5 rounded-lg ${pillar.color} w-fit mb-3 group-hover:scale-105 transition-transform`}>
                <pillar.icon className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-orange-400 transition-colors flex items-center justify-between">
                <span>{pillar.title}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-relaxed">
                {pillar.desc}
              </CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
