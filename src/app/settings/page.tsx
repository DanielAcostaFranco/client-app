import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SettingsPanel from "@/components/settings/SettingsPanel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", data.user.id)
    .maybeSingle();

  return (
    <main className="min-h-[calc(100svh-65px)] w-full bg-slate-100 px-4 pb-28 pt-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your profile, appearance, and notifications.</p>
        <div className="mt-8">
          <SettingsPanel
            userId={data.user.id}
            initialName={profile?.name || data.user.user_metadata?.name || "there"}
            email={data.user.email || ""}
          />
        </div>
      </section>
    </main>
  );
}
