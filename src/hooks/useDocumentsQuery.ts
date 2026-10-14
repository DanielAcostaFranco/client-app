"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { DocumentRecord } from "@/types/documents";

export const documentsQueryKey = ["documents"] as const;

async function fetchDocuments(favoritesOnly: boolean) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Your session has expired.");

  let query = supabase
    .from("documents")
    .select("id, file_name, storage_path, file_type, file_size, description, renewal_instructions, tags, category, is_favorite, expires_at, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (favoritesOnly) query = query.eq("is_favorite", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
}

export function useDocumentsQuery({
  favoritesOnly = false,
  initialDocuments = [],
}: {
  favoritesOnly?: boolean;
  initialDocuments?: DocumentRecord[];
} = {}) {
  return useQuery({
    queryKey: [...documentsQueryKey, favoritesOnly ? "favorites" : "all"],
    queryFn: () => fetchDocuments(favoritesOnly),
    initialData: initialDocuments.length > 0 ? initialDocuments : undefined,
  });
}
