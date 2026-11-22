import { Metadata } from "next";
import { NotificationPageClient } from "@/components/notifications/NotificationPageClient";

export const metadata: Metadata = {
  title: "Notification Centre | GTA 6 Player Hub",
  description:
    "Real-time notifications for official Rockstar Games bulletins, verified retailer price drops, and timeline event reminders.",
};

export default function NotificationsPage() {
  return <NotificationPageClient />;
}
