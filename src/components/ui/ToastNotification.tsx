"use client";

import { useEffect } from "react";

type ToastNotificationProps = {
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
};

export default function ToastNotification({
  message,
  variant = "success",
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  const isError = variant === "error";

  return (
    <div className="fixed right-4 top-20 z-[80] w-[calc(100%-2rem)] max-w-sm sm:right-6">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
          isError
            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/90 dark:text-red-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
        }`}
      >
        <span className="text-base" aria-hidden="true">
          {isError ? "!" : "✓"}
        </span>
        <p className="min-w-0 flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="-mr-1 rounded px-1 text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
