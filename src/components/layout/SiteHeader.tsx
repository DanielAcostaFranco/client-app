import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ProfileMenu from "@/components/layout/ProfileMenu";
import MobileTabBar from "@/components/layout/MobileTabBar";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationBell from "@/components/notifications/NotificationBell";

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let name = "there";
  let email: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, profile_picture_url")
      .eq("id", user.id)
      .maybeSingle();

    const fullName =
      profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || "there";
    name = fullName.trim().split(/\s+/).slice(0, 2).join(" ") || "there";
    email = profile?.email || user.email || null;
    avatarUrl =
      profile?.profile_picture_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="site-brand flex min-w-0 items-center gap-2 text-2xl font-bold text-blue-700 dark:text-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/vaultly-shield.png"
            alt=""
            width={34}
            height={34}
            className="h-8 w-8 shrink-0 object-contain dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/vaultly-shield-midnight.png"
            alt=""
            width={34}
            height={34}
            className="hidden h-8 w-8 shrink-0 object-contain dark:block"
          />
          <span className="truncate">Vaultly</span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {user && (
            <nav aria-label="Desktop navigation" className="mr-2 hidden items-center gap-1 sm:flex">
              <Link href="/dashboard" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300">
                Dashboard
              </Link>
              <Link href="/documents" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300">
                My Documents
              </Link>
              <Link href="/favorites" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300">
                Favorites
              </Link>
            </nav>
          )}
          {user && <GlobalSearch />}
          {user && <NotificationBell />}
          {user ? (
            <div className="hidden sm:block">
              <ProfileMenu name={name} email={email} avatarUrl={avatarUrl} />
            </div>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      </header>

      {user && <MobileTabBar name={name} email={email} avatarUrl={avatarUrl} />}
    </>
  );
}
