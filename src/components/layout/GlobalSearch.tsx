"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export default function GlobalSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isDocumentsPage = pathname === "/documents";

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (isDocumentsPage) return null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    router.push(trimmedQuery ? `/documents?search=${encodeURIComponent(trimmedQuery)}` : "/documents");
  }

  return isOpen ? (
    <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center justify-end sm:max-w-sm">
      <div className="flex w-full items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700 shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
        <SearchIcon />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documents..."
          aria-label="Search documents"
          className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setIsOpen(false);
          }}
          aria-label="Close search"
          className="rounded-full px-1 text-lg leading-none text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
        >
          ×
        </button>
      </div>
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Search documents"
      className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-[#4b22d7] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300"
    >
      <SearchIcon />
    </button>
  );
}
