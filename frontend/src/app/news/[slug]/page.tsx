import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchNewsDetail } from "@/lib/newsApi";
import { NewsDetailPageClient } from "@/components/news/NewsDetailPageClient";

interface NewsDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchNewsDetail(slug);

  if (!article) {
    return {
      title: "Article Not Found – GTA 6 Player Hub",
      description: "The requested GTA 6 news article could not be located.",
    };
  }

  return {
    title: `${article.title} – GTA 6 Player Hub`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.original_published_at,
      authors: [article.source_name],
      images: article.image_url ? [{ url: article.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { slug } = await params;
  const article = await fetchNewsDetail(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary,
    "image": article.image_url ? [article.image_url] : [],
    "datePublished": article.original_published_at,
    "dateModified": article.original_published_at,
    "author": {
      "@type": "Organization",
      "name": article.source_name,
      "url": article.source_url,
    },
    "publisher": {
      "@type": "Organization",
      "name": "GTA 6 Player Hub",
      "url": "https://gta6playerhub.local",
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://gta6playerhub.local/news/${article.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailPageClient article={article} />
    </>
  );
}
