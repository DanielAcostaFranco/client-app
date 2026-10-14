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
    <main className="min-h-[calc(100svh-65px)] w-full overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:gap-16">
        <div>


          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            Store, organize, and stay on top of every important file.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Keep your documents secure, sort them into categories, find what you
            need quickly, and get timely reminders before important files expire.
          </p>

          <Link
            href="/auth/sign-in"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center py-4 md:py-10">
          <div className="absolute h-52 w-52 rounded-full bg-violet-200/70 blur-3xl sm:h-64 sm:w-64" />
          {/* Decorative folders illustration with a gentle floating animation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/floating-folders-alert.png"
            alt="Floating folders with an alert reminder"
            className="hero-float relative w-[72%] max-w-[360px] drop-shadow-2xl"
          />
        </div>
      </section>
    </main>
  );
}
