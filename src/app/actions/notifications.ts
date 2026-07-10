"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type NotificationActionState = {
  error?: string;
  success?: boolean;
};

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not_authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "update_failed" };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not_authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return { error: "update_failed" };
  }

  revalidatePath("/notifications");
  return { success: true };
}
