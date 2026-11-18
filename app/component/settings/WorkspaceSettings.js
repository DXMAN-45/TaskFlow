
"use client";

import { useEffect, useState } from "react";
import { Building2, Users, ShieldCheck, Pencil, Trash2, X, Check } from "lucide-react";

export default function WorkspaceSettings() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWorkspaces() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspaces");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load workspaces.");
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

  const activeWorkspace = workspaces.find(
    (workspace) =>
      String(workspace._id || workspace.id || workspace.workspaceId) ===
      String(activeWorkspaceId)
  );

  const workspaceId = activeWorkspace
    ? activeWorkspace._id || activeWorkspace.id || activeWorkspace.workspaceId
    : null;

  const isOwner = activeWorkspace?.role === "owner";

  async function handleRename() {
    if (!workspaceName.trim()) {
      setError("Workspace name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to rename workspace.");
      }

      setEditing(false);
      setMessage("Workspace renamed successfully.");
      await loadWorkspaces();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${activeWorkspace.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete workspace.");
      }

      setMessage("Workspace deleted successfully.");
      await loadWorkspaces();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading workspace settings...</p>
      </section>
    );
  }

  if (!activeWorkspace) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          No active workspace found.
        </p>
        <button
          onClick={loadWorkspaces}
          className="mt-3 text-sm font-semibold text-blue-600"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Workspace Management
          </h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            Manage your active workspace
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Workspace name
          </p>

          {editing ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                maxLength={50}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Enter workspace name"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleRename}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Check size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500"
                  aria-label="Cancel editing"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-900">
                {activeWorkspace.name}
              </p>

              {isOwner && (
                <button
                  onClick={() => {
                    setWorkspaceName(activeWorkspace.name || "");
                    setEditing(true);
                    setError("");
                    setMessage("");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Rename
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck size={16} />
              <span className="text-xs font-medium">Your role</span>
            </div>
            <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
              {activeWorkspace.role || "Member"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={16} />
              <span className="text-xs font-medium">Workspace members</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {activeWorkspace.memberCount ?? "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Workspace type
          </p>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {activeWorkspace.isDefault ? "Default workspace" : "Custom workspace"}
          </span>
        </div>

        {isOwner && !activeWorkspace.isDefault && (
          <div className="border-t border-red-100 pt-5">
            <h3 className="text-sm font-semibold text-red-700">
              Danger Zone
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Permanently delete this workspace. Existing restrictions,
              such as projects, members and pending invitations, still apply.
            </p>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete workspace"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
