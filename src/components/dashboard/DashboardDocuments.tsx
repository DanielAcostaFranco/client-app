"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import DocumentThumbnail from "@/components/documents/DocumentThumbnail";
import DocumentUploadBox from "@/components/documents/DocumentUploadBox";
import { documentsQueryKey, useDocumentsQuery } from "@/hooks/useDocumentsQuery";
import type { DocumentRecord } from "@/types/documents";

function formatFileSize(size: number | null) {
  if (!size) return "Unknown size";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardDocuments() {
  const queryClient = useQueryClient();
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const recentDocuments = documents.slice(0, 10);

  return (
    <>
      <div className="mt-8">
        <DocumentUploadBox
          onUploaded={(document) => {
            queryClient.setQueryData<DocumentRecord[]>([...documentsQueryKey, "all"], (current = []) => [document as DocumentRecord, ...current]);
          }}
        />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent documents</h2>
          <Link href="/documents" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View more
          </Link>
        </div>

        {isLoading && documents.length === 0 ? (
          <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : recentDocuments.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-slate-600">You have not uploaded any documents yet.</p>
            <Link href="/documents" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
              Upload a document
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {recentDocuments.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <DocumentThumbnail size="small" storagePath={document.storage_path} fileType={document.file_type} fileName={document.file_name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{document.file_name}</p>
                    <p className="text-sm text-slate-600">{formatFileSize(document.file_size)}{document.file_type ? ` · ${document.file_type}` : ""}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-slate-500">
                  {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(document.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
