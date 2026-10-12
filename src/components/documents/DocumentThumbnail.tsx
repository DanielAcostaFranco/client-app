"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type DocumentThumbnailProps = {
  storagePath: string;
  fileType: string | null;
  fileName: string;
  size?: "small" | "large";
};

export default function DocumentThumbnail({
  storagePath,
  fileType,
  fileName,
  size = "large",
}: DocumentThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestedRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const dimensions = size === "small" ? "h-14 w-14" : "h-32 w-full";
  const isImage = fileType?.startsWith("image/");
  const isPdf =
    fileType === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf") ||
    storagePath.toLowerCase().includes(".pdf");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || requestedRef.current || (!isImage && !isPdf)) return;
    const previewContainer = container;

    async function renderPdfThumbnail(pdfData: Uint8Array) {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = previewContainer.clientWidth || (size === "small" ? 56 : 320);
      const scale = (targetWidth / baseViewport.width) * 1.02;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return null;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.82);
    }

    async function loadThumbnail() {
      if (requestedRef.current) return;
      requestedRef.current = true;

      const supabase = createClient();
      try {
        let thumbnail: string | null;

        if (isPdf) {
          const { data, error } = await supabase.storage
            .from("documents")
            .download(storagePath);
          if (error || !data) throw error || new Error("Unable to download PDF preview");
          thumbnail = await renderPdfThumbnail(new Uint8Array(await data.arrayBuffer()));
        } else {
          const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(storagePath, 300);
          if (error || !data?.signedUrl) throw error || new Error("Unable to access image preview");
          thumbnail = data.signedUrl;
        }

        if (thumbnail) setPreviewUrl(thumbnail);
        else setPreviewFailed(true);
      } catch {
        setPreviewFailed(true);
      }
    }

    if (typeof IntersectionObserver === "undefined") {
      void loadThumbnail();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadThumbnail();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [fileType, isImage, isPdf, size, storagePath]);

  return (
    <div
      ref={containerRef}
      className={`${dimensions} overflow-hidden rounded-xl bg-slate-100`}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={`Preview of ${fileName}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : previewFailed ? (
        <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden="true">
          📄
        </div>
      ) : (
        <div className="flex h-full w-full animate-pulse items-center justify-center text-2xl text-slate-400" aria-hidden="true">
          …
        </div>
      )}
    </div>
  );
}
