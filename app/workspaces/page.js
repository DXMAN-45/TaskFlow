
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  Plus,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWorkspaces() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspaces");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load workspaces.");
      }

      setWorkspaces(data.workspaces || []);
      setActiveWorkspaceId(data.activeWorkspaceId || null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  function getWorkspaceId(workspace) {
    return String(
      workspace._id || workspace.id || workspace.workspaceId
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar />
      <Sidebarmob />

      <main className="ml-[76px] min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:ml-0 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">

          {/* Header */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Team Management
                </p>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Workspaces
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage your teams and switch between your workspaces.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white opacity-60"
            >
              <Plus size={17} />
              Create workspace
            </button>
          </header>

          {/* Workspace count */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total workspaces</p>
                  <p className="text-xl font-bold text-slate-900">
                    {loading ? "—" : workspaces.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Your active workspace</p>
                  <p className="truncate text-sm font-bold text-slate-900">
                    {loading
                      ? "Loading..."
                      : workspaces.find(
                          (workspace) =>
                            getWorkspaceId(workspace) ===
                            String(activeWorkspaceId)
                        )?.name || "Not selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace list */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Your workspaces
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Workspaces you own or are a member of.
                </p>
              </div>

              <button
                onClick={loadWorkspaces}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Refresh workspaces"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Loading your workspaces...
              </div>
            ) : !error && workspaces.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Building2
                  size={32}
                  className="mx-auto text-slate-300"
                />
                <h3 className="mt-3 font-semibold text-slate-800">
                  No workspaces found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create a workspace to start collaborating.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {workspaces.map((workspace) => {
                  const isActive =
                    getWorkspaceId(workspace) ===
                    String(activeWorkspaceId);

                  return (
                    <article
                      key={getWorkspaceId(workspace)}
                      className={`rounded-2xl border bg-white p-5 transition ${
                        isActive
                          ? "border-blue-300 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Building2 size={22} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-900">
                              {workspace.name}
                            </h3>
                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {workspace.role || "Member"}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={13} />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users size={15} />
                          {workspace.memberCount ?? "—"} members
                        </div>

                        <span className="text-xs text-slate-400">
                          {workspace.isDefault ? "Default" : "Custom"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
