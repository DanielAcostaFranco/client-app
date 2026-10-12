import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardDocuments from "@/components/dashboard/DashboardDocuments";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/sign-in");
  }

  const user = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || "there";
  const name = fullName.trim().split(/\s+/)[0]|| "there";

  return (
    <main className="min-h-[calc(100svh-65px)] w-full bg-slate-100 px-4 pb-28 pt-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Dashboard</h1>

        <p className="mt-4 text-lg text-slate-600">
          Welcome, {name}. Your secure document vault is ready.
        </p>

        <DashboardDocuments />
      </section>
    </main>
  );
}
