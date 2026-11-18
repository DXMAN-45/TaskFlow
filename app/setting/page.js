
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import WorkspaceSettings from "../component/settings/WorkspaceSettings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const client = await clientPromise;
  const db = client.db("taskflow");

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.user.id) },
    {
      projection: {
        googleId: 1,
        githubId: 1,
        githubUsername: 1,
      },
    }
  );

  if (!user) {
    redirect("/login");
  }

  const googleConnected = Boolean(user.googleId);
  const githubConnected = Boolean(user.githubId);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar />
      <Sidebarmob />

    <main className="ml-[76px] min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:ml-0 lg:p-8">
        <div className="mx-auto w-full max-w-5xl">

          {/* Header */}
          <header className="mb-8 sm:mb-10">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Account Management
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your profile, security, and connected accounts from one place.
            </p>
          </header>

          {/* Profile section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Profile Information
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Your TaskFlow account details
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 px-5 sm:grid-cols-2 sm:divide-y-0 sm:px-7">

              <div className="py-5 sm:border-b sm:border-slate-100 sm:pr-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Full Name
                </p>
                <p className="break-words text-sm font-semibold text-slate-800">
                  {session.user.name || "Not set"}
                </p>
              </div>

              <div className="py-5 sm:border-b sm:border-slate-100 sm:pl-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Email Address
                </p>
                <p className="break-all text-sm font-semibold text-slate-800">
                  {session.user.email || "Not set"}
                </p>
              </div>

              <div className="py-5 sm:col-span-2">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  TaskFlow User ID
                </p>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="break-all font-mono text-xs text-slate-600">
                    {session.user.id}
                  </p>
                </div>
              </div>

            </div>
          </section>
{/* Workspace Management
<div className="mt-6">
  <WorkspaceSettings />
</div> */}
          {/* Connected Accounts */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Security & Connected Accounts
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Manage your external sign-in methods
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">

              {/* Google */}
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                    <svg viewBox="0 0 48 48" className="h-6 w-6">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" transform="translate(0 2)" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.9 46.98 24.55z" transform="translate(0 2)" />
                      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78z" transform="translate(0 2)" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" transform="translate(0 -2)" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Google
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Sign in using your Google account.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      googleConnected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      googleConnected ? "bg-emerald-500" : "bg-slate-400"
                    }`} />
                    {googleConnected ? "Connected" : "Not connected"}
                  </span>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400"
                  >
                    Connect Google
                  </button>
                </div>
              </div>

              {/* GitHub */}
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.13c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.21.43-2.2 1.15-2.97-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.11 2.94.72.77 1.15 1.76 1.15 2.97 0 4.27-2.6 5.22-5.08 5.49.4.35.75 1.02.75 2.06v3.15c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      GitHub
                    </h3>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      {githubConnected
                        ? `Connected as @${user.githubUsername || "GitHub user"}`
                        : "Sign in using your GitHub account."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      githubConnected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      githubConnected ? "bg-emerald-500" : "bg-slate-400"
                    }`} />
                    {githubConnected ? "Connected" : "Not connected"}
                  </span>

                  <a
                    href="/api/link/github"
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    {githubConnected ? "Reconnect GitHub" : "Connect GitHub"}
                  </a>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
              <p className="text-xs leading-5 text-slate-500">
                Your connected accounts are linked to your existing TaskFlow account.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 text-center">
            <p className="text-xs text-slate-400">
              TaskFlow · Account Settings
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}
