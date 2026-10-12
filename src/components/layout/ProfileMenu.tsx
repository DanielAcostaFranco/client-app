"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ProfileMenuProps = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
  menuPlacement?: "bottom" | "top";
};

export default function ProfileMenu({
  name,
  email,
  avatarUrl,
  menuPlacement = "bottom",
}: ProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const [isDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedTheme = window.localStorage.getItem("vaultly-theme");
    return (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-left shadow-sm hover:bg-slate-50"
      >
        {avatarUrl && !hasAvatarError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={avatarUrl}
            src={avatarUrl}
            alt={`${name} profile picture`}
            onError={(event) => {
              event.currentTarget.style.display = "none";
              setHasAvatarError(true);
            }}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
            width={32}
            height={32}
            referrerPolicy="no-referrer"
            loading="eager"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">
          {name}
        </span>
        <span aria-hidden="true" className="text-xs text-slate-500 dark:text-slate-400">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className={`absolute right-0 z-10 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${
            menuPlacement === "top" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <p className="font-medium text-slate-900 dark:text-slate-100">{name}</p>
            {email && <p className="truncate text-sm text-slate-600 dark:text-slate-400">{email}</p>}
          </div>

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
