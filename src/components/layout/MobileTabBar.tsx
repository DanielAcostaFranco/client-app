"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileMenu from "@/components/layout/ProfileMenu";

type MobileTabBarProps = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

function Icon({ name }: { name: "dashboard" | "documents" | "favorites" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect {...common} x="3" y="3" width="7" height="7" rx="1.5" />
        <rect {...common} x="14" y="3" width="7" height="7" rx="1.5" />
        <rect {...common} x="3" y="14" width="7" height="7" rx="1.5" />
        <rect {...common} x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === "documents") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path {...common} d="M6 3.5h8l4 4V20.5H6z" />
        <path {...common} d="M14 3.5v4h4M9 12h6M9 16h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path {...common} d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" />
    </svg>
  );
}

export default function MobileTabBar({ name, email, avatarUrl }: MobileTabBarProps) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
    { href: "/documents", label: "My Documents", icon: "documents" as const },
    { href: "/favorites", label: "Favorites", icon: "favorites" as const },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(32,20,80,0.08)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/90 sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href === "/documents" && pathname.startsWith("/documents"));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "text-[#4b22d7] dark:text-violet-300"
                  : "text-slate-500 hover:text-[#4b22d7] dark:text-slate-400 dark:hover:text-violet-300"
              }`}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        <div className="flex min-w-16 flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <ProfileMenu
            name={name}
            email={email}
            avatarUrl={avatarUrl}
            menuPlacement="top"
          />
          <span>Profile</span>
        </div>
      </div>
    </nav>
  );
}
