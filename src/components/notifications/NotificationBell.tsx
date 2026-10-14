"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  document_id: string | null;
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at, document_id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data as NotificationRecord[]);
    }

    void loadNotifications();
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  async function markRead(notification: NotificationRecord) {
    if (!notification.is_read) {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", notification.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    }

    setIsOpen(false);
    router.push("/documents");
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        ♢
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
            <button type="button" onClick={() => void markAllRead()} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
              Mark all read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No notifications yet.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void markRead(notification)}
                  className={`w-full rounded-xl p-3 text-left transition hover:bg-violet-50 dark:hover:bg-slate-700 ${notification.is_read ? "bg-slate-50 dark:bg-slate-900" : "bg-violet-50 dark:bg-violet-950/40"}`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                  <p className="mt-1 whitespace-pre-line text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                  <p className="mt-2 text-[10px] text-slate-400">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.created_at))}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
