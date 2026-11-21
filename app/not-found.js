"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">

      {/* Logo */}
      <Link
        href="/"
        className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 transition-opacity hover:opacity-80 sm:left-6 sm:translate-x-0"
      >
        <Image
          src="/icon.png"
          alt="TaskFlow logo"
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />

        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Task<span className="text-cyan-400">Flow</span>
        </span>
      </Link>

      {/* 404 Content */}
      <section className="w-full max-w-lg text-center">

        {/* Error code */}
        <div className="mb-8">
          <p className="text-[clamp(5rem,15vw,8rem)] font-bold leading-none tracking-[-0.08em] text-slate-900">
            404
          </p>

          <div className="mx-auto mt-5 h-[3px] w-10 rounded-full bg-cyan-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-500 sm:text-base">
          The page you're looking for doesn't exist or may have moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">

          {/* Dashboard Button */}
          <Link
            href="/dashboard"
            className="group inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0F172A] px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
          >
            Back to dashboard

            <span className="ml-2 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          {/* Go Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
          >
            Go back
          </button>

        </div>
      </section>
    </main>
  );
}
