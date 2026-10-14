"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import StatusModal from "@/components/ui/StatusModal";
import { getExactReminderAt } from "@/utils/exactReminder";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DOCUMENT_CATEGORIES = [
  "Insurance",
  "ID",
  "Medical",
  "Financial",
  "Legal",
  "Education",
  "Work",
  "Travel",
  "Vehicle",
  "Other",
];

type UploadedDocument = {
  id: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  renewal_instructions: string | null;
  tags: string[];
  category: string;
  is_favorite: boolean;
  expires_at: string | null;
  created_at: string;
};

type DocumentUploadBoxProps = {
  onUploaded?: (document: UploadedDocument) => void;
  compact?: boolean;
};

export default function DocumentUploadBox({
  onUploaded,
  compact = false,
}: DocumentUploadBoxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [renewalInstructions, setRenewalInstructions] = useState("");
  const [category, setCategory] = useState("Other");
  const [customCategory, setCustomCategory] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reminders, setReminders] = useState<{ scheduledAt: string; message: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  function selectFile(file: File) {
    setErrorMessage(null);

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("File must be smaller than 10 MB.");
      setStatusModal({
        title: "File not uploaded",
        message: "The file must be smaller than 10 MB.",
        variant: "error",
      });
      return;
    }

    setPendingFile(file);
    setDocumentName(file.name);
    setTags("");
    setDescription("");
    setRenewalInstructions("");
    setCategory("Other");
    setCustomCategory("");
    setExpiresAt("");
    setReminders([]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) selectFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) selectFile(file);
  }

  function cancelDetails() {
    setPendingFile(null);
    setDocumentName("");
    setTags("");
    setDescription("");
    setRenewalInstructions("");
    setCategory("Other");
    setCustomCategory("");
    setExpiresAt("");
    setReminders([]);
    setErrorMessage(null);
  }

  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingFile || !documentName.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);
    const expiration = expiresAt ? new Date(expiresAt) : null;
    if (expiration && (Number.isNaN(expiration.getTime()) || expiration.getTime() <= Date.now())) {
      setErrorMessage("Choose an expiration date and time in the future.");
      setIsSaving(false);
      return;
    }
    if (expiration) {
      for (const reminder of reminders) {
        if (!getExactReminderAt(reminder.scheduledAt, expiration)) {
          setErrorMessage("Choose a reminder date and time after now and before expiration.");
          setIsSaving(false);
          return;
        }
      }
    }
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setStatusModal({
        title: "Upload failed",
        message: "Your session has expired. Please sign in again.",
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    const safeFileName = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${userData.user.id}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, pendingFile, {
        contentType: pendingFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setStatusModal({
        title: "Upload failed",
        message: uploadError.message,
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const finalCategory = category === "Custom"
      ? customCategory.trim()
      : category;

    if (!finalCategory) {
      setErrorMessage("Please choose or enter a category.");
      setStatusModal({
        title: "Category required",
        message: "Choose a category or enter your own custom category.",
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    const expirationTimestamp = expiration?.toISOString() || null;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const { data: savedDocument, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: userData.user.id,
        file_name: documentName.trim(),
        storage_path: storagePath,
        file_type: pendingFile.type || null,
        file_size: pendingFile.size,
        description: description.trim() || null,
        renewal_instructions: renewalInstructions.trim() || null,
        tags: parsedTags,
        category: finalCategory,
        is_favorite: false,
        expires_at: expirationTimestamp,
        expiration_timezone: userTimezone,
      })
      .select("id, file_name, storage_path, file_type, file_size, description, renewal_instructions, tags, category, is_favorite, expires_at, created_at")
      .single();

    if (insertError || !savedDocument) {
      await supabase.storage.from("documents").remove([storagePath]);
      const errorText = insertError?.message || "Unable to save document metadata.";
      setErrorMessage(errorText);
      setStatusModal({ title: "Upload failed", message: errorText, variant: "error" });
      setIsSaving(false);
      return;
    }

    if (expiresAt && reminders.length > 0) {
      const reminderRows = reminders.map((reminder) => ({
          document_id: savedDocument.id,
          user_id: userData.user.id,
          scheduled_at: new Date(reminder.scheduledAt).toISOString(),
          reminder_message: reminder.message.trim() || null,
          status: "active",
          timezone: userTimezone,
        }));

      const { error: reminderError } = await supabase
        .from("document_reminders")
        .insert(reminderRows);

      if (reminderError) {
        await supabase.from("documents").delete().eq("id", savedDocument.id);
        await supabase.storage.from("documents").remove([storagePath]);
        setStatusModal({
          title: "Reminder could not be saved",
          message: reminderError?.message
            ? `Supabase error: ${reminderError.message}`
            : "The reminder table could not be updated. Run the reminder migration in Supabase, then try uploading again.",
          variant: "error",
        });
        setIsSaving(false);
        return;
      }
    }

    setStatusModal({
      title: "Document uploaded",
      message: `${documentName.trim()} is now safely stored in your vault.`,
      variant: "success",
    });
    setIsSaving(false);
    cancelDetails();
    onUploaded?.(savedDocument as UploadedDocument);
    router.refresh();
  }

  return (
    <div className={compact ? "" : "rounded-2xl bg-white p-6 shadow-sm"}>
      {compact ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload a document"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-3xl font-light leading-none text-white shadow-sm hover:bg-blue-700"
        >
          +
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Upload your document</h2>
              <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                Drag and drop a file here or click to browse.
              </p>
              <p className="mt-1 text-sm text-slate-600 sm:hidden">
                Tap the plus button to choose a file.
              </p>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Upload a document"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-3xl font-light leading-none text-white shadow-sm hover:bg-blue-700 sm:hidden"
            >
              +
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 hidden cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 sm:block ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-slate-800"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            <div className="text-4xl" aria-hidden="true">↑</div>
            <p className="mt-3 font-medium text-slate-900">Drop your file here</p>
            <p className="mt-1 text-sm text-slate-500">or click to choose a file · max 10 MB</p>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="sr-only"
      />

      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-6 py-8">
          <form
            onSubmit={saveDocument}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-slate-900">Document details</h2>
            <p className="mt-1 truncate text-sm text-slate-600">File: {pendingFile.name}</p>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Document name
              <input
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="insurance, vehicle, important"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Separate tags with commas.
              </span>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {DOCUMENT_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
                <option value="Custom">Custom category...</option>
              </select>
            </label>

            {category === "Custom" && (
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Custom category
                <input
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="e.g. Home"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
            )}

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Renewal instructions
              <textarea
                value={renewalInstructions}
                onChange={(event) => setRenewalInstructions(event.target.value)}
                rows={4}
                placeholder="Example: Renew at example.com. Bring your current ID and proof of address."
                className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                These instructions will appear in your expiration notification and extra reminders.
              </span>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Expiration date and time
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">You will automatically get an in-app notification when the document expires.</span>
            </label>

            {expiresAt && (
              <section className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">Extra reminders (optional)</h3>
                    <p className="mt-1 text-xs text-slate-600">Choose the exact date and time for each additional notification.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReminders((current) => [...current, { scheduledAt: "", message: "" }])}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Add reminder
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {reminders.map((reminder, index) => (
                    <div key={index} className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="flex items-end gap-2">
                        <label className="flex-1 text-xs font-medium text-slate-600">
                          Notification date and time
                          <input
                            type="datetime-local"
                            value={reminder.scheduledAt}
                            onChange={(event) => setReminders((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, scheduledAt: event.target.value } : item))}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={`Remove reminder ${index + 1}`}
                          onClick={() => setReminders((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="rounded-lg px-2 py-2 text-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >×</button>
                      </div>
                      <label className="mt-3 block text-xs font-medium text-slate-600">
                        Reminder message (optional)
                        <input
                          value={reminder.message}
                          onChange={(event) => setReminders((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, message: event.target.value } : item))}
                          placeholder="Start gathering renewal documents"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDetails}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !documentName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {statusModal && (
        <StatusModal
          title={statusModal.title}
          message={statusModal.message}
          variant={statusModal.variant}
          onClose={() => setStatusModal(null)}
        />
      )}

    </div>
  );
}
