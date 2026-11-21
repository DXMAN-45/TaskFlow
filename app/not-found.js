
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Home,
  Layers3,
  Search,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative isolate flex min-h-[85vh] items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.06] blur-[100px]" />

        <div className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-indigo-400/50" />
        <div className="absolute right-[16%] top-[28%] h-1.5 w-1.5 rounded-full bg-violet-400/60" />
        <div className="absolute bottom-[20%] left-[22%] h-1.5 w-1.5 rounded-full bg-indigo-400/40" />

        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 0.7px, transparent 0.7px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        {/* Illustration */}
        <div className="relative mb-9 flex h-52 w-full max-w-[440px] items-center justify-center sm:h-60">
          {/* Floating document */}
          <div className="absolute left-[14%] top-[22%] hidden -rotate-12 sm:block">
            <div className="flex h-16 w-14 flex-col gap-2 rounded-xl border border-gray-200/80 bg-white/80 p-3 shadow-lg shadow-gray-900/5 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="h-1.5 w-full rounded-full bg-gray-300 dark:bg-white/20" />
              <span className="h-1.5 w-3/4 rounded-full bg-gray-200 dark:bg-white/10" />
              <span className="h-1.5 w-4/5 rounded-full bg-gray-200 dark:bg-white/10" />
            </div>
          </div>

          {/* Main 404 */}
          <div className="relative flex items-center justify-center">
            <div className="absolute h-36 w-64 rounded-full bg-indigo-500/10 blur-3xl sm:h-44 sm:w-80" />

            <span className="relative select-none text-[108px] font-black leading-none tracking-[-0.09em] text-gray-200 dark:text-white/[0.10] sm:text-[148px]">
              404
            </span>

            {/* Central compass */}
            <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] items-center justify-center rounded-[26px] border border-indigo-200/80 bg-white shadow-[0_18px_55px_-18px_rgba(79,70,229,0.35)] dark:border-indigo-400/20 dark:bg-[#171827] sm:h-24 sm:w-24">
              <div className="absolute inset-1 rounded-[22px] border border-gray-100 dark:border-white/[0.06]" />
              <Compass
                size={43}
                strokeWidth={1.5}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>

          {/* Floating task card */}
          <div className="absolute bottom-[17%] right-[12%] hidden rotate-[10deg] sm:block">
            <div className="flex h-14 w-16 items-center justify-center rounded-xl border border-gray-200/80 bg-white/90 shadow-lg shadow-gray-900/5 dark:border-white/10 dark:bg-white/[0.04]">
              <Layers3
                size={23}
                className="text-indigo-500"
                strokeWidth={1.7}
              />
            </div>
          </div>

          {/* Small orbit dots */}
          <span className="absolute left-[29%] top-[13%] h-2 w-2 rounded-full bg-violet-400" />
          <span className="absolute bottom-[18%] right-[29%] h-2.5 w-2.5 rounded-full border-2 border-indigo-400/60" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Lost your way?
        </h1>

        <p className="mt-4 max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base">
          Looks like this page doesn't exist. It may have been moved,
          renamed, or the link might be outdated.
        </p>

        {/* Actions */}
        <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard"
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] sm:w-auto"
          >
            <Home size={17} />
            Back to Dashboard
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.07] dark:focus-visible:ring-offset-[#11121a] sm:w-auto"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>

        {/* Footer identity */}
        <div className="mt-14 flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400 dark:text-gray-500">
          <Layers3 size={15} className="text-indigo-500" />
          TASKFLOW
          <span className="mx-1 h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span>Page not found</span>
        </div>
      </section>
    </main>
  );
}
