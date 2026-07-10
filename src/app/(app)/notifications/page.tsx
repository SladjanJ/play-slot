import { NotificationsPanel } from "@/components/player/notifications-panel";
import { getUserNotifications } from "@/lib/notifications/data";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sr/login");
  }

  const notifications = await getUserNotifications(user.id);

  return <NotificationsPanel notifications={notifications} />;
}
