"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openAttempt, setOpenAttempt] = useState(0);

  const loadNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at, document_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setLoadError(error.message);
    } else {
      setNotifications((data ?? []) as NotificationRecord[]);
      setLoadError(null);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadNotifications(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  async function markRead(notification: NotificationRecord) {
    if (!notification.is_read) {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notification.id);
      if (error) {
        setLoadError(error.message);
        return;
      }
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    }

    setIsOpen(false);
    const nextOpenAttempt = openAttempt + 1;
    setOpenAttempt(nextOpenAttempt);
    router.push(notification.document_id
      ? `/documents?document=${encodeURIComponent(notification.document_id)}&open=${nextOpenAttempt}`
      : "/documents");
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
  }

  async function deleteNotification(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
          void loadNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
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
            <button type="button" onClick={() => void markAllRead()} disabled={unreadCount === 0 || !!loadError} className="text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-40">
              Mark all read
            </button>
          </div>

          {loadError && (
            <div role="alert" className="mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <p>Could not load notifications: {loadError}</p>
              <button type="button" onClick={() => void loadNotifications()} className="mt-2 font-semibold underline">Try again</button>
            </div>
          )}

          {loadError ? null : notifications.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No notifications yet.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className={`flex items-start gap-1 rounded-xl transition hover:bg-violet-50 dark:hover:bg-slate-700 ${notification.is_read ? "bg-slate-50 dark:bg-slate-900" : "bg-violet-50 dark:bg-violet-950/40"}`}>
                  <button
                    type="button"
                    onClick={() => void markRead(notification)}
                    className="min-w-0 flex-1 p-3 text-left"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                    <p className="mt-1 whitespace-pre-line text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                    <p className="mt-2 text-[10px] text-slate-400">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.created_at))}</p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete notification: ${notification.title}`}
                    title="Delete notification"
                    onClick={() => void deleteNotification(notification.id)}
                    className="mr-2 mt-2 rounded p-1 text-lg leading-none text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
