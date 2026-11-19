
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  Plus,
  RefreshCw,
  Settings,
  ArrowLeftRight,
  X,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState(null);

  // Create workspace states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Load all workspaces
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

  // Get workspace ID
  function getWorkspaceId(workspace) {
    return String(
      workspace._id || workspace.id || workspace.workspaceId
    );
  }

  // Switch active workspace
  async function handleSwitchWorkspace(workspaceId) {
    if (!workspaceId || workspaceId === String(activeWorkspaceId)) {
      return;
    }

    try {
      setSwitchingWorkspaceId(workspaceId);
      setError("");

      const response = await fetch(
        `/api/workspaces/${workspaceId}/active`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workspaceId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to switch workspace."
        );
      }

      setActiveWorkspaceId(workspaceId);

      // Reload so the rest of the application
      // can load data from the newly active workspace.
      window.location.reload();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSwitchingWorkspaceId(null);
    }
  }

  // Create workspace
  async function handleCreateWorkspace(e) {
    e.preventDefault();

    const name = workspaceName.trim();

    if (!name || name.length > 50) {
      setCreateError(
        "Workspace name must be between 1 and 50 characters."
      );
      return;
    }

    try {
      setCreatingWorkspace(true);
      setCreateError("");

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create workspace."
        );
      }

      setWorkspaceName("");
      setShowCreateModal(false);
      setCreateSuccess("Workspace created successfully.");

      await loadWorkspaces();
    } catch (err) {
      setCreateError(
        err.message || "Something went wrong."
      );
    } finally {
      setCreatingWorkspace(false);
    }
  }

  // Close create modal
  function handleCloseCreateModal() {
    if (creatingWorkspace) return;

    setShowCreateModal(false);
    setWorkspaceName("");
    setCreateError("");
  }

  const activeWorkspace = workspaces.find(
    (workspace) =>
      getWorkspaceId(workspace) === String(activeWorkspaceId)
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar active="workspaces" />
      <Sidebarmob active="workspaces" />

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
              onClick={() => {
                setCreateError("");
                setCreateSuccess("");
                setShowCreateModal(true);
              }}
              disabled={
                creatingWorkspace ||
                switchingWorkspaceId !== null
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Create workspace
            </button>
          </header>

          {/* Success Message */}
          {createSuccess && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                {createSuccess}
              </div>

              <button
                type="button"
                onClick={() => setCreateSuccess("")}
                aria-label="Dismiss success message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Workspace Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Total Workspaces */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Total workspaces
                  </p>

                  <p className="text-xl font-bold text-slate-900">
                    {loading ? "—" : workspaces.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Workspace */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={20} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Your active workspace
                  </p>

                  <p className="truncate text-sm font-bold text-slate-900">
                    {loading
                      ? "Loading..."
                      : activeWorkspace?.name || "Not selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace List */}
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
                type="button"
                onClick={loadWorkspaces}
                disabled={
                  loading ||
                  switchingWorkspaceId !== null ||
                  creatingWorkspace
                }
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Refresh workspaces"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Loading Error */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadWorkspaces}
                  className="shrink-0 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Loading your workspaces...
              </div>
            ) : !error && workspaces.length === 0 ? (
              /* Empty State */
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
              /* Workspace Cards */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {workspaces.map((workspace) => {
                  const workspaceId = getWorkspaceId(workspace);

                  const isActive =
                    workspaceId === String(activeWorkspaceId);

                  const isSwitching =
                    switchingWorkspaceId === workspaceId;

                  return (
                    <article
                      key={workspaceId}
                      className={`rounded-2xl border bg-white p-5 transition ${
                        isActive
                          ? "border-blue-300 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Card Header */}
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

                      {/* Card Information */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users size={15} />
                          {workspace.memberCount ?? "—"} members
                        </div>

                        <span className="text-xs text-slate-400">
                          {workspace.isDefault ? "Default" : "Custom"}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">

                        {/* Switch Workspace */}
                        {isActive ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700"
                          >
                            <CheckCircle2 size={15} />
                            Current workspace
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleSwitchWorkspace(workspaceId)
                            }
                            disabled={
                              switchingWorkspaceId !== null ||
                              creatingWorkspace
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSwitching ? (
                              <RefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <ArrowLeftRight size={15} />
                            )}

                            {isSwitching
                              ? "Switching..."
                              : "Switch workspace"}
                          </button>
                        )}

                        {/* Manage Workspace */}
                        <a
                          href={`/workspaces/${workspaceId}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Settings size={15} />
                          Manage
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCreateModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={22} />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create workspace
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new space to manage another team.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={creatingWorkspace}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Create Form */}
            <form onSubmit={handleCreateWorkspace}>
              <label
                htmlFor="workspaceName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Workspace name
              </label>

              <input
                id="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value);
                  setCreateError("");
                }}
                placeholder="e.g. Marketing Team"
                maxLength={50}
                autoFocus
                disabled={creatingWorkspace}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {workspaceName.length}/50
              </div>

              {createError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {createError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={creatingWorkspace}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingWorkspace ||
                    !workspaceName.trim() ||
                    workspaceName.trim().length > 50
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingWorkspace && (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {creatingWorkspace
                    ? "Creating..."
                    : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
