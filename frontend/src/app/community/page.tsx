import React from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Bookmark, 
  Lock, 
  ShieldAlert,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const DEMO_POSTS = [
  {
    id: "post-1",
    author: "ViceCityNavigator",
    tag: "Leonida Lore",
    title: "Leonida map topology breakdown based on trailer geography and real-world Florida keys",
    content: "Analyzing the highway signage in the first trailer reveals references to Port Gellhorn, Vice Gardens, and Ambrosia. How seamless will travel between the urban metro and the wetlands be?",
    replies: 54,
    likes: 189,
    timestamp: "3 hours ago"
  },
  {
    id: "post-2",
    author: "ConsolePilot_PS5",
    tag: "Performance & Tech",
    title: "Target frame rate analysis: Will GTA 6 run at 30 FPS or offer a 40 FPS 120Hz performance mode?",
    content: "Given the density of the physics engine and real-time ray-traced global illumination, a rock-solid 30 FPS is likely the launch baseline for base PS5 and Xbox Series X.",
    replies: 92,
    likes: 245,
    timestamp: "6 hours ago"
  },
  {
    id: "post-3",
    author: "JasonAndLuciaFan",
    tag: "Story & Mechanics",
    title: "Dual-protagonist inventory sharing: What we can expect from Bonnie and Clyde dynamic",
    content: "RDR 2 introduced the horse saddlebag system for weapons. In GTA 6, could the car trunk serve as the shared mobile stash for both characters?",
    replies: 31,
    likes: 118,
    timestamp: "12 hours ago"
  }
];

export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          <Users className="w-4 h-4" />
          <span>Player Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          GTA 6 Gaming Community
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Connect with fellow Grand Theft Auto VI players, discuss theories, share hardware insights, and join community groups.
        </p>
      </div>

      {/* Phase Notice */}
      <div className="mb-6 p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Phase 1 Interface Preview:</span> Full social backend, live posts, user registration, and moderation safeguards will be activated in Phase 7. The feed below demonstrates the layout and interaction architecture.
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Feed Controls: Search + Categories */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Input 
              icon={<Search className="w-4 h-4" />}
              placeholder="Search community discussions..."
              className="w-full"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 overflow-x-auto pb-1 sm:pb-0">
              <Button variant="primary" size="sm">
                All Topics
              </Button>
              <Button variant="secondary" size="sm">
                Lore & Map
              </Button>
              <Button variant="secondary" size="sm">
                PC & Tech
              </Button>
              <Button variant="secondary" size="sm">
                Consoles
              </Button>
            </div>
          </div>

          {/* Protected Action Prompt */}
          <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Start a Discussion</h4>
                <p className="text-xs text-slate-400">Sign in with your player account to post and participate.</p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="secondary" size="sm" className="gap-1.5 shrink-0">
                <Lock className="w-3.5 h-3.5" />
                Sign In to Post
              </Button>
            </Link>
          </div>

          {/* Post Cards Feed */}
          <div className="space-y-4">
            {DEMO_POSTS.map((post) => (
              <Card key={post.id} className="border-[#1e2330] hover:border-[#2e374c] transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white hover:text-orange-400 transition-colors cursor-pointer">
                      @{post.author}
                    </span>
                    <span className="text-slate-600">•</span>
                    <Badge variant="outline">{post.tag}</Badge>
                  </div>
                  <span className="text-xs text-slate-500">{post.timestamp}</span>
                </div>

                <CardTitle className="text-base sm:text-lg text-white mb-2 leading-snug">
                  {post.title}
                </CardTitle>

                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {post.content}
                </p>

                <CardFooter className="pt-3 border-t border-[#1a1f2b] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-orange-400 transition-colors cursor-pointer">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-orange-400 transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.replies} replies</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-[#1a1f2c] hover:text-white transition-colors" title="Bookmark">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-[#1a1f2c] hover:text-white transition-colors" title="Share">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Community Guidelines */}
          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Community Standards</span>
            </CardTitle>
            <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Keep all discussions focused on GTA VI.</li>
              <li>Label speculative posts as theories or rumours.</li>
              <li>Respect fellow players; zero tolerance for harassment.</li>
              <li>No unsupported multiplayer lobbies or scams.</li>
            </ul>
          </Card>

          {/* Popular Groups Preview */}
          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-3">Player Groups</CardTitle>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Vice City Explorers</div>
                  <div className="text-slate-500">1.2k members</div>
                </div>
                <Button variant="outline" size="sm">Join</Button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1f2b]">
                <div>
                  <div className="font-semibold text-white">PC Builders & Modders</div>
                  <div className="text-slate-500">840 members</div>
                </div>
                <Button variant="outline" size="sm">Join</Button>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
