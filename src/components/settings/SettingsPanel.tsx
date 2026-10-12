"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ToastNotification from "@/components/ui/ToastNotification";

type SettingsPanelProps = {
  userId: string;
  initialName: string;
  email: string;
};

export default function SettingsPanel({
  userId,
  initialName,
  email,
}: SettingsPanelProps) {
  const [name, setName] = useState(initialName);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("vaultly-theme") === "dark";
  });
  const [expirationNotifications, setExpirationNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultReminderDays, setDefaultReminderDays] = useState("30");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notification_preferences")
        .select("expiration_notifications, email_notifications, default_reminder_days")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setExpirationNotifications(data.expiration_notifications);
        setEmailNotifications(data.email_notifications);
        setDefaultReminderDays(String(data.default_reminder_days));
      }
    }

    void loadPreferences();
  }, [userId]);

  function toggleDarkMode() {
    const nextValue = !isDarkMode;
    setIsDarkMode(nextValue);
    window.localStorage.setItem("vaultly-theme", nextValue ? "dark" : "light");
  }

  async function saveName() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSavingName(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, name: trimmedName, email }, { onConflict: "id" });

    setIsSavingName(false);
    setToast(error
      ? { message: error.message, variant: "error" }
      : { message: "Your display name was updated." });
  }

  async function saveNotificationPreferences() {
    setIsSavingNotifications(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        expiration_notifications: expirationNotifications,
        email_notifications: emailNotifications,
        default_reminder_days: Number(defaultReminderDays),
      });

    setIsSavingNotifications(false);
    setToast(error
      ? { message: error.message, variant: "error" }
      : { message: "Notification preferences saved." });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profile</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Update the name shown in Vaultly.</p>
        <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Display name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <button
          type="button"
          onClick={() => void saveName()}
          disabled={isSavingName || !name.trim()}
          className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSavingName ? "Saving..." : "Save name"}
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Appearance</h2>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="mt-5 flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-4 text-left dark:bg-slate-900"
        >
          <span>
            <span className="block font-semibold text-slate-900 dark:text-slate-100">Dark mode</span>
            <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">Use Vaultly with a darker color palette.</span>
          </span>
          <span className={`relative h-7 w-12 rounded-full transition-colors ${isDarkMode ? "bg-violet-600" : "bg-slate-300"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
          </span>
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose how Vaultly should remind you about expiring documents.</p>

        <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-4 dark:bg-slate-900">
          <span className="font-medium text-slate-900 dark:text-slate-100">Expiration reminders</span>
          <input type="checkbox" checked={expirationNotifications} onChange={(event) => setExpirationNotifications(event.target.checked)} className="h-5 w-5 accent-violet-600" />
        </label>

        <label className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-4 dark:bg-slate-900">
          <span className="font-medium text-slate-900 dark:text-slate-100">Email notifications</span>
          <input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} className="h-5 w-5 accent-violet-600" />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Default reminder timing
          <select value={defaultReminderDays} onChange={(event) => setDefaultReminderDays(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="1">1 day before</option>
            <option value="7">7 days before</option>
            <option value="14">14 days before</option>
            <option value="30">30 days before</option>
            <option value="60">60 days before</option>
          </select>
        </label>

        <button type="button" onClick={() => void saveNotificationPreferences()} disabled={isSavingNotifications} className="mt-5 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {isSavingNotifications ? "Saving..." : "Save notification preferences"}
        </button>
      </section>

      {toast && <ToastNotification message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}
