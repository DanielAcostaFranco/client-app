"use client";

import type { DocumentRecord } from "@/types/documents";

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-summary-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">Document summary</p>
            <h2 id="document-summary-title" className="mt-1 break-words text-xl font-bold text-slate-900 dark:text-white">{document.file_name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close document summary" className="rounded-lg px-2 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">×</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-red-600 p-3 text-white shadow-sm sm:col-span-2"><dt className="text-[11px] font-bold uppercase tracking-wide text-red-100">Expires</dt><dd className="mt-1 text-base font-bold text-white">{formatDate(document.expires_at)}</dd></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><dt className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Category</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{document.category || "Other"}</dd></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><dt className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Added</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(document.created_at)}</dd></div>
          </dl>

          {document.description && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Description</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{document.description}</p></div>}
          {document.renewal_instructions && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Renewal instructions</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{document.renewal_instructions}</p></div>}
          {document.tags && document.tags.length > 0 && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tags</h3><div className="mt-2 flex flex-wrap gap-2">{document.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600">{tag}</span>)}</div></div>}
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
          <button type="button" onClick={onEdit} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">Edit details</button>
          <button type="button" onClick={onDownload} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">Download file</button>
          <button type="button" onClick={onOpenFile} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">Open file</button>
        </div>
      </section>
    </div>
  );
}
