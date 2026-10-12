"use client";

type StatusModalProps = {
  title: string;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
};

export default function StatusModal({
  title,
  message,
  variant = "success",
  onClose,
}: StatusModalProps) {
  const isError = variant === "error";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-6 py-8">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
            isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
          aria-hidden="true"
        >
          {isError ? "!" : "✓"}
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full rounded-lg px-4 py-2.5 font-semibold text-white ${
            isError
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
