
"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, Check, Loader2 } from "lucide-react";

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function readResponse(response) {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Expected JSON but received an invalid response. HTTP ${response.status}. Check the API route and server terminal.`
      );
    }
  }

  async function loadWorkspaces() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/workspaces", {
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to load workspaces.");
      }

      setWorkspaces(data.workspaces || []);
      setActiveWorkspaceId(data.activeWorkspaceId || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function switchWorkspace(workspaceId) {
    setSwitching(true);
    setError("");
    setMessage("");

    try {
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to switch workspace.");
      }

      setActiveWorkspaceId(workspaceId);
      setMessage("Workspace switched successfully.");
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitching(false);
    }
  }

  async function createWorkspace(e) {
    e.preventDefault();

    if (!name.trim()) return;

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace.");
      }

      setName("");
      setMessage("Workspace created successfully.");
      await loadWorkspaces();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const activeWorkspace = workspaces.find(
    (workspace) =>
      String(workspace._id) === String(activeWorkspaceId)
  );

  return (
    <div className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Current workspace</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {loading
              ? "Loading workspaces..."
              : activeWorkspace?.name || "No workspace selected"}
          </p>
        </div>

        {loading ? (
          <Loader2 className="animate-spin text-slate-400" size={18} />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
            Your workspaces
          </p>

          {workspaces.map((workspace) => {
            const isActive =
              String(workspace._id) === String(activeWorkspaceId);

            return (
              <button
                key={String(workspace._id)}
                type="button"
                disabled={switching || isActive}
                onClick={() => switchWorkspace(String(workspace._id))}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-70"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {workspace.role}
                  </p>
                </div>

                {isActive && (
                  <Check size={17} className="text-green-600" />
                )}
              </button>
            );
          })}

          <div className="my-3 border-t border-slate-100" />

          <form onSubmit={createWorkspace} className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New workspace name"
              maxLength={50}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Create workspace"}
            </button>
          </form>
        </div>
      )}

      {switching && (
        <p className="mt-2 text-xs text-slate-500">
          Switching workspace...
        </p>
      )}

      {error && (
        <p className="mt-2 break-words text-xs text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-2 text-xs text-green-600">
          {message}
        </p>
      )}
    </div>
  );
}
