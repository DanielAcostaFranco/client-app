import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Vaultly
        </p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Authentication Error
        </h1>

        <p className="mt-3 text-slate-600">
          We could not complete your sign-in. Please try again.
        </p>

        <Link
          href="/auth/sign-in"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          Return to Sign In
        </Link>
      </section>
    </main>
  );
}
