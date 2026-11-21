
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  House,
  Waypoints,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative isolate flex min-h-[75vh] items-center overflow-hidden bg-[#f8f9fc] px-5 py-14 text-slate-950 dark:bg-[#0c0d13] dark:text-white sm:px-8 lg:px-12">

      {/* Background detail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-500/[0.06] blur-[110px]"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">

        {/* LEFT: Visual */}
        <div className="relative order-2 min-w-0 lg:order-1">

          <div className="relative isolate aspect-[1.15/1] w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.22)] dark:border-white/[0.09] dark:bg-[#12141e]">

            {/* Subtle dot grid */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.13]"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 0.8px, transparent 0.8px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Top identity */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/[0.07] sm:px-8">

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Waypoints size={17} />
                </div>

                <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">
                  TaskFlow
                </span>
              </div>

              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-400 dark:text-slate-500">
                ROUTE / 404
              </span>
            </div>

            {/* Large 404 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-[clamp(9rem,22vw,14rem)] font-black leading-none tracking-[-0.105em] text-slate-100 dark:text-white/[0.045]">
                404
              </span>
            </div>

            {/* Route illustration */}
            <svg
              aria-hidden="true"
              viewBox="0 0 600 420"
              fill="none"
              className="absolute inset-0 z-10 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="route-gradient" x1="70" y1="300" x2="530" y2="170">
                  <stop stopColor="#818cf8" />
                  <stop offset=".52" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>

              {/* Connection path */}
              <path
                d="M65 295 H150 C195 295 195 205 240 205 H275"
                stroke="url(#route-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Broken route */}
              <path
                d="M325 205 H358 C407 205 407 125 455 125 H525"
                stroke="url(#route-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="7 10"
                opacity=".65"
              />

              <path
                d="M325 205 H360"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Route points */}
              <circle cx="65" cy="295" r="8" fill="#6366f1" />
              <circle cx="65" cy="295" r="15" stroke="#6366f1" strokeOpacity=".2" strokeWidth="2" />

              <circle cx="240" cy="205" r="7" fill="#818cf8" />
              <circle cx="240" cy="205" r="14" stroke="#818cf8" strokeOpacity=".2" strokeWidth="2" />

              {/* Missing connection */}
              <circle
                cx="300"
                cy="205"
                r="21"
                fill="#eef2ff"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />

              <path
                d="M293 198 L307 212 M307 198 L293 212"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle cx="455" cy="125" r="6" fill="#a78bfa" />
              <circle cx="525" cy="125" r="8" fill="#a78bfa" fillOpacity=".8" />

              {/* Decorative small paths */}
              <path
                d="M455 125 V85 H510"
                stroke="#a78bfa"
                strokeOpacity=".3"
                strokeWidth="1.5"
                strokeDasharray="4 7"
              />
            </svg>

            {/* Floating route label */}
            <div className="absolute bottom-7 left-6 z-20 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-2 shadow-sm dark:border-white/10 dark:bg-[#1a1c29] sm:bottom-8 sm:left-8">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Route unavailable
              </span>
            </div>

            {/* Coordinates */}
            <span className="absolute bottom-8 right-8 z-20 hidden font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-600 sm:block">
              TF / 00.404
            </span>

          </div>
        </div>

        {/* RIGHT: Message and navigation */}
        <section className="order-1 lg:order-2">

          <h1 className="max-w-lg text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.055em] text-slate-900 dark:text-white">
            We couldn't find this page.
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-7 text-slate-500 dark:text-slate-400 sm:text-base">
            The link may be outdated, or the page may have moved.
            Head back to your workspace and pick up where you left off.
          </p>

          {/* Navigation actions */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/dashboard"
              className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0d13]"
            >
              <House size={17} />

              Go to dashboard

              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.07] dark:focus-visible:ring-offset-[#0c0d13]"
            >
              <ArrowLeft size={17} />
              Go back
            </button>

          </div>

          {/* Bottom detail */}
          <div className="mt-12 flex items-center gap-3 border-t border-slate-200/80 pt-6 dark:border-white/[0.08]">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Waypoints size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Your workspace is still here.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Return to TaskFlow and continue managing your work.
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
