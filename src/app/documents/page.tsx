import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DocumentManager from "@/components/documents/DocumentManager";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;

  return (
    <main className="min-h-[calc(100svh-65px)] w-full bg-slate-100 px-4 pb-28 pt-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-5xl">
        <div className="mt-3">
          <DocumentManager
            initialDocuments={[]}
            initialSearchQuery={params.search || ""}
          />
        </div>
      </section>
    </main>
  );
}
