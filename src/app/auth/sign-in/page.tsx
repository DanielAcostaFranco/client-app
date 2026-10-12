import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { createClient } from "@/utils/supabase/server";

export default async function SignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100svh-65px)] w-full items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-lg sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/vaultly-logo-unlocked.png"
          alt="Vaultly"
          width={160}
          height={160}
          className="mx-auto h-32 w-32 object-contain"
        />

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Welcome to Vaultly
        </h1>

        <p className="mt-3 text-slate-600">
          Sign in to access your secure document vault.
        </p>

        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
