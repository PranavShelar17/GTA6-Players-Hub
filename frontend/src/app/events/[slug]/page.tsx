import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchEventBySlug } from "@/lib/eventApi";
import { EventDetailPageClient } from "@/components/events/EventDetailPageClient";

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await fetchEventBySlug(slug);
    return {
      title: `${event.title} | GTA 6 Events`,
      description: event.short_summary || event.description.slice(0, 160),
    };
  } catch {
    return {
      title: "Event Details | GTA 6 Player Hub",
    };
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;

  try {
    const event = await fetchEventBySlug(slug);
    return <EventDetailPageClient event={event} />;
  } catch {
    notFound();
  }
}
