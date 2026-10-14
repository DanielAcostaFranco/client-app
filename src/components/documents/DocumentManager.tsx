"use client";

import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import DocumentUploadBox from "@/components/documents/DocumentUploadBox";
import DocumentThumbnail from "@/components/documents/DocumentThumbnail";
import ToastNotification from "@/components/ui/ToastNotification";
import { documentsQueryKey, useDocumentsQuery } from "@/hooks/useDocumentsQuery";
import type { DocumentRecord as SharedDocumentRecord } from "@/types/documents";

export type DocumentRecord = SharedDocumentRecord;

function formatFileSize(size: number | null) {
  if (!size) return "Unknown size";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function DocumentManager({
  initialDocuments,
  title = "My Documents",
  initialSearchQuery = "",
  showUpload = true,
  showSearch = true,
  showFilters = true,
  maxDocuments,
  viewMoreHref,
}: {
  initialDocuments: DocumentRecord[];
  title?: string;
  initialSearchQuery?: string;
  showUpload?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  maxDocuments?: number;
  viewMoreHref?: string;
}) {
  const queryClient = useQueryClient();
  const favoritesOnly = title === "Favorites";
  const listQueryKey = [...documentsQueryKey, favoritesOnly ? "favorites" : "all"] as const;
  const { data: documents = [] } = useDocumentsQuery({ favoritesOnly, initialDocuments });
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "document" | "other">("all");
  const [dateAddedFilter, setDateAddedFilter] = useState<"all" | "7" | "30" | "365">("all");
  const [currentTime] = useState(() => Date.now());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRenewalInstructions, setEditRenewalInstructions] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRecord[] | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextCardClick = useRef(false);

  async function createDocumentUrl(document: DocumentRecord, expiresIn = 60) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, expiresIn);

    if (error || !data?.signedUrl) {
      setErrorMessage(error?.message || "Unable to access this document.");
      return null;
    }

    return data.signedUrl;
  }

  async function handleOpen(document: DocumentRecord) {
    setOpenMenuId(null);
    setErrorMessage(null);
    setPreviewingDocument(document);
    setPreviewUrl(null);
    setIsLoadingPreview(true);
    const url = await createDocumentUrl(document, 300);
    setPreviewUrl(url);
    setIsLoadingPreview(false);
  }

  async function handleDownload(document: DocumentRecord) {
    setOpenMenuId(null);
    setErrorMessage(null);
    const url = await createDocumentUrl(document, 300);
    if (!url) return;

    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.file_name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }

  async function handleShare(document: DocumentRecord) {
    setOpenMenuId(null);
    setErrorMessage(null);
    const url = await createDocumentUrl(document, 3600);
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Share link copied. It will expire in one hour.");
    } catch {
      setErrorMessage("Could not copy the share link. Please try again.");
    }
  }

  async function toggleFavorite(document: DocumentRecord) {
    const nextValue = !document.is_favorite;
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ is_favorite: nextValue })
      .eq("id", document.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    queryClient.setQueryData<DocumentRecord[]>(listQueryKey, (current = []) => {
      const updated = current
        .map((item) => item.id === document.id ? { ...item, is_favorite: nextValue } : item)
        .filter((item) => !favoritesOnly || item.is_favorite);
      return updated;
    });
    queryClient.setQueryData<DocumentRecord[]>([...documentsQueryKey, "all"], (current = []) =>
      current.map((item) => item.id === document.id ? { ...item, is_favorite: nextValue } : item),
    );
    setMessage(nextValue ? "Added to favorites." : "Removed from favorites.");
  }

  function startLongPress(documentId: string) {
    if (selectionMode) return;
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelectedIds(new Set([documentId]));
      ignoreNextCardClick.current = true;
      setOpenMenuId(null);
    }, 550);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function toggleSelected(documentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function openEdit(document: DocumentRecord) {
    setOpenMenuId(null);
    setEditingDocument(document);
    setEditName(document.file_name);
    setEditTags((document.tags || []).join(", "));
    setEditDescription(document.description || "");
    setEditRenewalInstructions(document.renewal_instructions || "");
    setEditCategory(document.category || "Other");
    setEditExpiresAt(document.expires_at ? document.expires_at.slice(0, 10) : "");
    setErrorMessage(null);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDocument || !editName.trim()) return;

    setIsSavingEdit(true);
    setErrorMessage(null);
    const parsedTags = editTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const supabase = createClient();
    const { data: updatedDocument, error } = await supabase
      .from("documents")
      .update({
        file_name: editName.trim(),
        tags: parsedTags,
        description: editDescription.trim() || null,
        renewal_instructions: editRenewalInstructions.trim() || null,
        category: editCategory.trim() || "Other",
        expires_at: editExpiresAt || null,
      })
      .eq("id", editingDocument.id)
      .select("id, file_name, storage_path, file_type, file_size, description, renewal_instructions, tags, category, is_favorite, expires_at, created_at")
      .single();

    if (error || !updatedDocument) {
      setErrorMessage(error?.message || "Unable to update this document.");
      setIsSavingEdit(false);
      return;
    }

    queryClient.setQueryData<DocumentRecord[]>(listQueryKey, (current = []) =>
      current.map((document) =>
        document.id === editingDocument.id
          ? (updatedDocument as DocumentRecord)
          : document,
      ),
    );
    queryClient.setQueryData<DocumentRecord[]>([...documentsQueryKey, favoritesOnly ? "all" : "favorites"], (current = []) =>
      current.map((document) =>
        document.id === editingDocument.id ? (updatedDocument as DocumentRecord) : document,
      ).filter((document) => !favoritesOnly || document.is_favorite),
    );
    setEditingDocument(null);
    setIsSavingEdit(false);
    setMessage("Document updated successfully.");
  }

  async function handleDelete(document: DocumentRecord) {
    setOpenMenuId(null);
    setDocumentToDelete([document]);
  }

  async function confirmDelete() {
    if (!documentToDelete) return;

    const documentsToDelete = documentToDelete;
    setDocumentToDelete(null);
    setMessage(null);
    setErrorMessage(null);

    const supabase = createClient();
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove(documentsToDelete.map((document) => document.storage_path));

    if (storageError) {
      setErrorMessage(storageError.message);
      return;
    }

    const { error: databaseError } = await supabase
      .from("documents")
      .delete()
      .in("id", documentsToDelete.map((document) => document.id));

    if (databaseError) {
      setErrorMessage(databaseError.message);
      return;
    }

    const deletedIds = new Set(documentsToDelete.map((document) => document.id));
    queryClient.setQueryData<DocumentRecord[]>(listQueryKey, (current = []) => current.filter((item) => !deletedIds.has(item.id)));
    queryClient.setQueriesData<DocumentRecord[]>({ queryKey: documentsQueryKey }, (current = []) => current.filter((item) => !deletedIds.has(item.id)));
    exitSelectionMode();
    setMessage(documentsToDelete.length === 1 ? "Document deleted." : `${documentsToDelete.length} documents deleted.`);
  }

  const filteredDocuments = documents.filter((document) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || [
      document.file_name,
      document.description || "",
      document.category || "",
      ...(document.tags || []),
    ].some((value) => value.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    const fileName = document.file_name.toLowerCase();
    const fileType = document.file_type?.toLowerCase() || "";
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const isDocument = fileType === "application/pdf" ||
      fileType.startsWith("text/") ||
      /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i.test(fileName);
    const matchesType = typeFilter === "all" ||
      (typeFilter === "image" && isImage) ||
      (typeFilter === "video" && isVideo) ||
      (typeFilter === "document" && isDocument) ||
      (typeFilter === "other" && !isImage && !isVideo && !isDocument);

    if (!matchesType) return false;

    if (dateAddedFilter !== "all") {
      const days = Number(dateAddedFilter);
      const cutoff = currentTime - days * 24 * 60 * 60 * 1000;
      if (new Date(document.created_at).getTime() < cutoff) return false;
    }

    return true;
  });
  const visibleDocuments = maxDocuments
    ? filteredDocuments.slice(0, maxDocuments)
    : filteredDocuments;

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 hidden text-xs text-slate-500 sm:block">Hold a card to select multiple documents.</p>
        </div>
        <div className="flex items-center gap-4">
          {viewMoreHref && (
            <Link href={viewMoreHref} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View more
            </Link>
          )}
          {showUpload && (
            <DocumentUploadBox
              compact
              onUploaded={(document) => {
                queryClient.setQueryData<DocumentRecord[]>([...documentsQueryKey, "all"], (current = []) => [document as DocumentRecord, ...current]);
              }}
            />
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-violet-100 px-4 py-3 dark:bg-violet-950/60">
          <p className="text-sm font-semibold text-violet-800 dark:text-violet-100">
            {selectedIds.size} selected
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={exitSelectionMode} className="rounded-full px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-200 dark:text-violet-100 dark:hover:bg-violet-900">
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setDocumentToDelete(documents.filter((document) => selectedIds.has(document.id)))}
              className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      {showSearch && (
        <div className="mt-5">
          <label htmlFor="document-search" className="sr-only">Search documents</label>
          <input
            id="document-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search documents, descriptions, or tags..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      )}

      {showFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-600">Quick filters:</span>
          {([
            ["all", "All"],
            ["image", "Images"],
            ["video", "Videos"],
            ["document", "Documents"],
            ["other", "Other"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                typeFilter === value
                  ? "bg-violet-600 text-white"
                  : "bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              {label}
            </button>
          ))}
          <label className="sr-only" htmlFor="date-added-filter">Filter by date added</label>
          <select
            id="date-added-filter"
            value={dateAddedFilter}
            onChange={(event) => setDateAddedFilter(event.target.value as typeof dateAddedFilter)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          >
            <option value="all">Any date added</option>
            <option value="7">Added in the last 7 days</option>
            <option value="30">Added in the last 30 days</option>
            <option value="365">Added in the last year</option>
          </select>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">You have not uploaded any documents yet.</p>
        </div>
      ) : visibleDocuments.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No documents match your search.</p>
        </div>
      ) : (
        <div className="mt-8 grid min-w-0 max-w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDocuments.map((document) => (
            <article
              key={document.id}
              onPointerDown={() => startLongPress(document.id)}
              onPointerUp={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onClick={() => {
                if (ignoreNextCardClick.current) {
                  ignoreNextCardClick.current = false;
                  return;
                }
                if (selectionMode) toggleSelected(document.id);
                else void handleOpen(document);
              }}
              className={`relative min-w-0 max-w-full cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 ${
                selectedIds.has(document.id) ? "ring-2 ring-violet-500 ring-offset-2" : ""
              }`}
            >
              <div className="relative">
                <DocumentThumbnail
                  storagePath={document.storage_path}
                  fileType={document.file_type}
                  fileName={document.file_name}
                />

                <button
                  type="button"
                  aria-label={document.is_favorite ? `Remove ${document.file_name} from favorites` : `Add ${document.file_name} to favorites`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleFavorite(document);
                  }}
                  className={`absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xl leading-none shadow-sm backdrop-blur ${document.is_favorite ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                >
                  {document.is_favorite ? "★" : "☆"}
                </button>

                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    aria-label={`Actions for ${document.file_name}`}
                    aria-expanded={openMenuId === document.id}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(openMenuId === document.id ? null : document.id);
                    }}
                    className="rounded-lg bg-white/90 px-2 py-1 text-xl leading-none text-slate-500 shadow-sm backdrop-blur hover:bg-white hover:text-slate-800"
                  >
                    ⋮
                  </button>

                  {openMenuId === document.id && (
                    <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                      <button type="button" onClick={(event) => { event.stopPropagation(); void handleOpen(document); }} className="menu-action">
                        Open
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(document); }} className="menu-action">
                        Edit
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void handleDownload(document); }} className="menu-action">
                        Download
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void handleShare(document); }} className="menu-action">
                        Share
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void handleDelete(document); }} className="menu-action text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="mt-5 truncate font-semibold text-slate-900" title={document.file_name}>
                {document.file_name}
              </h3>
              {document.category && (
                <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-200">
                  {document.category}
                </span>
              )}
              <p className="mt-1 text-sm text-slate-500">
                {formatFileSize(document.file_size)} · {formatDate(document.created_at)}
              </p>
              {document.description && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{document.description}</p>
              )}
              {document.renewal_instructions && (
                <p className="mt-3 line-clamp-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Renewal instructions: {document.renewal_instructions}
                </p>
              )}
              {document.tags && document.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {document.expires_at && (
                <p className="mt-4 text-xs font-medium text-amber-700">
                  Expires {formatDate(document.expires_at)}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {editingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-6 py-8">
          <form onSubmit={saveEdit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900">Edit document</h2>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Document name
              <input value={editName} onChange={(event) => setEditName(event.target.value)} required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Tags
              <input value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder="insurance, vehicle, important" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Category
              <input value={editCategory} onChange={(event) => setEditCategory(event.target.value)} placeholder="Insurance" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Description
              <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Renewal instructions
              <textarea value={editRenewalInstructions} onChange={(event) => setEditRenewalInstructions(event.target.value)} rows={4} placeholder="Where to renew, what to bring, or what steps to follow" className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Expiration date
              <input type="date" value={editExpiresAt} onChange={(event) => setEditExpiresAt(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>

            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingDocument(null)} disabled={isSavingEdit} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSavingEdit || !editName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {previewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6 sm:px-8">
          <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">
                  {previewingDocument.file_name}
                </h2>
                <p className="text-xs text-slate-500">Preview link expires in 5 minutes.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewingDocument(null);
                  setPreviewUrl(null);
                }}
                aria-label="Close preview"
                className="rounded-lg px-3 py-2 text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-hidden bg-slate-100 p-4 sm:p-6">
              {isLoadingPreview ? (
                <div className="flex h-full items-center justify-center text-slate-600">
                  Loading preview...
                </div>
              ) : previewUrl && (
                previewingDocument.file_type === "application/pdf" ||
                previewingDocument.file_name.toLowerCase().endsWith(".pdf")
              ) ? (
                <iframe
                  src={previewUrl}
                  title={`Preview of ${previewingDocument.file_name}`}
                  loading="lazy"
                  className="h-full min-h-[60vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : previewUrl && previewingDocument.file_type?.startsWith("image/") ? (
                <div className="no-scrollbar flex h-full items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`Preview of ${previewingDocument.file_name}`}
                    loading="lazy"
                    className="max-h-full max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : previewUrl ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-slate-700">
                    This file type cannot be previewed in the browser.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDownload(previewingDocument)}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Download file
                  </button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-red-600">
                  Unable to load this preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {documentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-6 py-8">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Delete {documentToDelete.length === 1 ? "document" : "documents"}?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove {documentToDelete.length === 1 ? (
                <span className="font-semibold">{documentToDelete[0].file_name}</span>
              ) : (
                <span className="font-semibold">{documentToDelete.length} documents</span>
              )} from your vault.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocumentToDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <ToastNotification
          message={message}
          onClose={() => setMessage(null)}
        />
      )}
      {errorMessage && (
        <ToastNotification
          message={errorMessage}
          variant="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
