import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchCommunityPosts,
  fetchPlayerCommunityProfile,
} from "@/lib/communityApi";
import { CommunityPlayerProfileClient } from "@/components/community/CommunityPlayerProfileClient";

interface PlayerProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PlayerProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | GTA 6 Player Profile`,
    description: `View @${username}'s community posts, discussions, and gaming network profile on GTA 6 Player Hub.`,
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { username } = await params;

  try {
    const profile = await fetchPlayerCommunityProfile(username);
    const postsData = await fetchCommunityPosts({
      player_id: profile.id,
      limit: 30,
    });

    return (
      <CommunityPlayerProfileClient
        profile={profile}
        initialPosts={postsData.posts}
      />
    );
  } catch {
    notFound();
  }
}
