"use client"
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-6 py-16">
      <section className="w-full max-w-md">
        <p className="text-sm font-medium tracking-wide text-gray-400 dark:text-gray-500">
          404 / NOT FOUND
        </p>

        <h1 className="mt-8 text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Lost your way?
        </h1>

        <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base">
          This page doesn't exist. The link may be outdated
          or the page may have moved.
        </p>

        <div className="mt-9 flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to dashboard <span aria-hidden="true">→</span>
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Go back
          </button>
        </div>
      </section>
    </main>
  );
}
