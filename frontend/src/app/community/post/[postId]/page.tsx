import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchPostComments,
  fetchPostDetail,
} from "@/lib/communityApi";
import { CommunityPostDetailClient } from "@/components/community/CommunityPostDetailClient";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { postId } = await params;
  try {
    const post = await fetchPostDetail(postId);
    return {
      title: `${post.title} | GTA 6 Gaming Community`,
      description: post.content.slice(0, 160),
    };
  } catch {
    return {
      title: "Community Post | GTA 6 Player Hub",
    };
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { postId } = await params;

  try {
    const [post, comments] = await Promise.all([
      fetchPostDetail(postId),
      fetchPostComments(postId),
    ]);

    return (
      <CommunityPostDetailClient
        initialPost={post}
        initialComments={comments}
      />
    );
  } catch {
    notFound();
  }
}
