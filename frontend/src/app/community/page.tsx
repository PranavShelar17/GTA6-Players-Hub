import { Metadata } from "next";
import {
  fetchCommunityCategories,
  fetchCommunityPosts,
} from "@/lib/communityApi";
import { CommunityPageClient } from "@/components/community/CommunityPageClient";

export const metadata: Metadata = {
  title: "Gaming Community | GTA 6 Player Hub",
  description:
    "Join the Grand Theft Auto VI gaming community. Connect with Vice City players, discuss gameplay and story theories, share setups, and participate in community polls.",
};

export default async function CommunityPage() {
  const [categories, postsData] = await Promise.all([
    fetchCommunityCategories(),
    fetchCommunityPosts({ feed_type: "latest", limit: 30 }),
  ]);

  return (
    <CommunityPageClient
      initialPosts={postsData.posts}
      categories={categories}
    />
  );
}
