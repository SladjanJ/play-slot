import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_notification", {
      p_user_id: input.userId,
      p_type: input.type,
      p_title: input.title,
      p_message: input.message,
      p_metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("[notifications] create failed:", error.message);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error("[notifications] create skipped:", error);
    return null;
  }
}

export async function getUnreadNotificationCount(userId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getUserNotifications(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("id, type, title, message, read, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data as NotificationRow[];
}
