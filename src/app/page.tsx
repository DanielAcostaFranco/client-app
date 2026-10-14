import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[calc(100svh-65px)] w-full bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center gap-4 sm:mb-10">
          {/* This intro video is intentionally mobile-only. */}
          <video
            className="h-20 w-20 shrink-0 rounded-3xl object-cover sm:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/brand/vaultly-logo-unlocked.png"
            aria-label="Vaultly intro animation"
          >
            <source src="/brand/vaultly-intro.mp4" type="video/mp4" />
          </video>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Vaultly
            </p>
            <p className="mt-1 text-sm text-slate-500">Your private space for important documents.</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-900">
          Your important information, organized and secure.
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Store your documents, find what you need, and receive reminders before
          they expire.
        </p>

        <Link
          href="/auth/sign-in"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </section>
    </main>
  );
}
