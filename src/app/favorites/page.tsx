import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DocumentManager from "@/components/documents/DocumentManager";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/auth/sign-in");

  return (
    <main className="min-h-[calc(100svh-65px)] w-full bg-slate-100 px-4 pb-28 pt-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-5xl">
        <DocumentManager
          title="Favorites"
          showUpload={false}
          initialDocuments={[]}
        />
      </section>
    </main>
  );
}
