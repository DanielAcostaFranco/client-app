"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { DocumentRecord } from "@/types/documents";

type Reminder = {
  id: string;
  scheduled_at: string | null;
  amount: number | null;
  unit: string | null;
  reminder_message: string | null;
  status: string;
};

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function DocumentSummaryCard({
  document,
  onClose,
  onOpenFile,
  onEdit,
  onDownload,
}: {
  document: DocumentRecord;
  onClose: () => void;
  onOpenFile: () => void;
  onEdit: () => void;
  onDownload: () => void;
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    let active = true;
    const loadReminders = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("document_reminders")
        .select("id, scheduled_at, amount, unit, reminder_message, status")
        .eq("document_id", document.id)
        .order("scheduled_at", { ascending: true });
      if (active) setReminders((data ?? []) as Reminder[]);
    };
    void loadReminders();
    return () => { active = false; };
  }, [document.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section role="dialog" aria-modal="true" aria-labelledby="document-summary-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Document summary</p>
            <h2 id="document-summary-title" className="mt-1 break-words text-2xl font-bold text-slate-900">{document.file_name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close document summary" className="rounded-lg px-2 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase text-slate-500">Category</dt><dd className="mt-1 text-slate-800">{document.category || "Other"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-slate-500">Added</dt><dd className="mt-1 text-slate-800">{formatDate(document.created_at)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-500">Expires</dt><dd className="mt-1 font-medium text-amber-700">{formatDate(document.expires_at)}</dd></div>
        </dl>

        {document.description && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{document.description}</p></div>
        )}
        {document.renewal_instructions && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4"><h3 className="font-semibold text-amber-900">Renewal instructions</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{document.renewal_instructions}</p></div>
        )}
        {document.tags && document.tags.length > 0 && (
          <div className="mt-4"><h3 className="text-sm font-semibold text-slate-900">Tags</h3><div className="mt-2 flex flex-wrap gap-2">{document.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{tag}</span>)}</div></div>
        )}

        <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
          <button type="button" onClick={onEdit} className="rounded-lg border border-violet-300 px-4 py-2 font-medium text-violet-700 hover:bg-violet-50">Edit details</button>
          <button type="button" onClick={onDownload} className="rounded-lg border border-blue-300 px-4 py-2 font-medium text-blue-700 hover:bg-blue-50">Download file</button>
          <button type="button" onClick={onOpenFile} className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700">Open file</button>
        </div>
      </section>
    </div>
  );
}
