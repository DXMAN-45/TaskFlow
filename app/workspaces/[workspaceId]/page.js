
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  UserPlus,
  Settings,
  Shield,
  Crown,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Save,
  AlertTriangle,
  Loader2,
  Mail,
} from "lucide-react";

import Sidebar from "../../component/Sidebar";
import Sidebarmob from "../../component/Sidebarmob";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function WorkspaceManagementPage() {
  const params = useParams();
  const router = useRouter();

  const workspaceId = params.workspaceId;

  const [activeTab, setActiveTab] = useState("overview");

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [inviteRole, setInviteRole] = useState("member");
  const [sendingInviteId, setSendingInviteId] = useState(null);

  const [memberActionId, setMemberActionId] = useState(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState(null);

  const currentRole = workspace?.role || "member";

  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin";
  const canManageInvitations = isOwner || isAdmin;

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data;
  }

  async function loadWorkspaceData() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [workspaceData, memberData] = await Promise.all([
        apiRequest(`/api/workspaces/${workspaceId}`),
        apiRequest(`/api/workspaces/${workspaceId}/members`),
      ]);

      setWorkspace(workspaceData.workspace);
      setWorkspaceName(workspaceData.workspace.name || "");

      setMembers(memberData.members || []);

      const role = workspaceData.workspace.role;

      if (role === "owner" || role === "admin") {
        try {
          const invitationData = await apiRequest(
            `/api/invitations?workspaceId=${encodeURIComponent(workspaceId)}`
          );

          setInvitations(invitationData.invitations || []);
        } catch (err) {
          setInvitations([]);
          setError(err.message);
        }
      } else {
        setInvitations([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  function getUserId(member) {
    return String(
      member.userId?._id ||
      member.userId ||
      ""
    );
  }

  function getInvitationId(invitation) {
    return String(invitation._id || invitation.id || "");
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(text) {
    setError(text);
    setMessage("");
  }

  // Search existing TaskFlow users
  async function handleSearchUsers(event) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query.length < 2) {
      showError("Enter at least 2 characters to search.");
      return;
    }

    try {
      setSearching(true);
      setSearchResults([]);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/api/workspaces/${workspaceId}/users/search?q=${encodeURIComponent(query)}`
      );

      setSearchResults(data.users || []);

      if (!data.users?.length) {
        showMessage("No available users found.");
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSearching(false);
    }
  }

  // Send workspace invitation
  async function handleSendInvitation(user) {
    const invitedUserId = String(user._id);

    try {
      setSendingInviteId(invitedUserId);
      setError("");
      setMessage("");

      await apiRequest(
        `/api/invitations?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitedUserId,
            role: inviteRole,
          }),
        }
      );

      setSearchResults((previous) =>
        previous.filter(
          (item) => String(item._id) !== invitedUserId
        )
      );

      const invitationData = await apiRequest(
        `/api/invitations?workspaceId=${encodeURIComponent(workspaceId)}`
      );

      setInvitations(invitationData.invitations || []);

      showMessage(`Invitation sent to @${user.username}.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setSendingInviteId(null);
    }
  }

  // Revoke invitation
  async function handleRevokeInvitation(invitation) {
    const invitationId = getInvitationId(invitation);

    if (!window.confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }

    try {
      setRevokingInvitationId(invitationId);
      setError("");
      setMessage("");

      await apiRequest(
        `/api/invitations/${invitationId}/revoke?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
        }
      );

      await loadWorkspaceData();

      showMessage("Invitation revoked successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setRevokingInvitationId(null);
    }
  }

  // Change member role (owner only)
  async function handleChangeRole(member, newRole) {
    const userId = getUserId(member);

    if (!window.confirm(`Change this member's role to ${newRole}?`)) {
      return;
    }

    try {
      setMemberActionId(userId);
      setError("");
      setMessage("");

      await apiRequest(
        `/api/workspaces/${workspaceId}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      await loadWorkspaceData();

      showMessage("Member role updated successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setMemberActionId(null);
    }
  }

  // Remove member
  async function handleRemoveMember(member) {
    const userId = getUserId(member);

    const username =
      member.username ||
      member.name ||
      "this member";

    if (!window.confirm(`Remove ${username} from this workspace?`)) {
      return;
    }

    try {
      setMemberActionId(userId);
      setError("");
      setMessage("");

      await apiRequest(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      await loadWorkspaceData();

      showMessage(`${username} was removed from the workspace.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setMemberActionId(null);
    }
  }

  // Rename workspace
  async function handleRenameWorkspace(event) {
    event.preventDefault();

    const name = workspaceName.trim();

    if (!name || name.length > 50) {
      showError("Workspace name must be between 1 and 50 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/api/workspaces/${workspaceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      setWorkspace((previous) => ({
        ...previous,
        ...data.workspace,
        role: previous.role,
        memberCount: previous.memberCount,
      }));

      setWorkspaceName(data.workspace.name);

      showMessage("Workspace name updated successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete workspace
  async function handleDeleteWorkspace() {
    if (workspace?.isDefault) {
      showError("The default workspace cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you absolutely sure you want to delete "${workspace.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await apiRequest(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      router.push("/workspaces");
    } catch (err) {
      showError(err.message);
      setDeleting(false);
    }
  }

  function getRoleIcon(role) {
    if (role === "owner") return <Crown size={14} />;
    if (role === "admin") return <Shield size={14} />;
    return <Users size={14} />;
  }

  function getRoleStyle(role) {
    if (role === "owner") {
      return "bg-amber-50 text-amber-700";
    }

    if (role === "admin") {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  const totalMembers = members.length;

  if (loading) {
    return (
      <div className="flex h-dvh overflow-hidden bg-slate-50">
        <Sidebar />
        <Sidebarmob />

        <main className="ml-[76px] flex flex-1 items-center justify-center lg:ml-0">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading workspace...
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-dvh overflow-hidden bg-slate-50">
        <Sidebar />
        <Sidebarmob />

        <main className="ml-[76px] flex flex-1 items-center justify-center p-6 lg:ml-0">
          <div className="max-w-md text-center">
            <AlertTriangle
              size={36}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Workspace unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error || "This workspace could not be found."}
            </p>

            <button
              onClick={() => router.push("/workspaces")}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to workspaces
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar />
      <Sidebarmob />

      <main className="ml-[76px] min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:ml-0 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">

          {/* Back Button */}
          <button
            onClick={() => router.push("/workspaces")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            All workspaces
          </button>

          {/* Workspace Header */}
          <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Building2 size={27} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {workspace.name}
                  </h1>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getRoleStyle(currentRole)}`}
                  >
                    {currentRole}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Workspace management
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadWorkspaceData}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50"
              aria-label="Refresh workspace"
            >
              <RefreshCw size={17} />
            </button>
          </header>

          {/* Feedback */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          {/* Navigation */}
          <div className="mb-7 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setMessage("");
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <section className="space-y-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Users size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Total members
                      </p>

                      <p className="text-2xl font-bold text-slate-900">
                        {totalMembers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Your role
                      </p>

                      <p className="text-lg font-bold capitalize text-slate-900">
                        {currentRole}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                      <Clock size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Pending invitations
                      </p>

                      <p className="text-2xl font-bold text-slate-900">
                        {canManageInvitations
                          ? pendingInvitations.length
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Workspace information
                </h2>

                <div className="mt-5 divide-y divide-slate-100">
                  <div className="flex items-center justify-between gap-3 py-4">
                    <span className="text-sm text-slate-500">
                      Workspace name
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {workspace.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-4">
                    <span className="text-sm text-slate-500">
                      Workspace type
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {workspace.isDefault ? "Default" : "Custom"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-4">
                    <span className="text-sm text-slate-500">
                      Your permissions
                    </span>

                    <span className="text-sm font-semibold capitalize text-slate-900">
                      {currentRole}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-4">
                    <span className="text-sm text-slate-500">
                      Created
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {formatDate(workspace.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Workspace members
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      People who belong to this workspace.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("members")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {members.slice(0, 4).map((member) => (
                    <div
                      key={getUserId(member)}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {member.name || member.username || "Unknown user"}
                        </p>

                        <p className="text-xs text-slate-500">
                          @{member.username || "user"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getRoleStyle(member.role)}`}
                      >
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No members found.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* MEMBERS */}
          {activeTab === "members" && (
            <section className="rounded-2xl border border-slate-200 bg-white">

              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Workspace members
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage people and their workspace permissions.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const userId = getUserId(member);

                  const isMemberOwner = member.role === "owner";

                  const canRemove =
                    !isMemberOwner &&
                    (isOwner ||
                      (isAdmin && member.role === "member"));

                  const canChangeRole =
                    isOwner && !isMemberOwner;

                  const busy = memberActionId === userId;

                  return (
                    <div
                      key={userId}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                            {(member.name || member.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {member.name || member.username || "Unknown user"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            @{member.username || "user"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold capitalize ${getRoleStyle(member.role)}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>

                        {canChangeRole && (
                          <select
                            value={member.role}
                            disabled={busy}
                            onChange={(event) =>
                              handleChangeRole(member, event.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 disabled:opacity-50"
                            aria-label={`Change role for ${member.username || member.name}`}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}

                        {canRemove && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveMember(member)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {members.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No workspace members found.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* INVITATIONS */}
          {activeTab === "invitations" && (
            <section className="space-y-6">

              {!canManageInvitations ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <Shield
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <h2 className="mt-3 font-bold text-slate-900">
                    Access restricted
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Only workspace owners and admins can manage invitations.
                  </p>
                </div>
              ) : (
                <>
                  {/* Invite Users */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <UserPlus size={21} />
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900">
                          Invite people
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Invite existing TaskFlow users by username.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleSearchUsers}
                      className="mt-5 flex flex-col gap-3 sm:flex-row"
                    >
                      <div className="relative flex-1">
                        <Search
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder="Search username..."
                          maxLength={20}
                          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={searching}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {searching ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}
                        Search users
                      </button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="text-xs font-semibold text-slate-600">
                        Invitation role
                      </label>

                      <select
                        value={inviteRole}
                        onChange={(event) =>
                          setInviteRole(event.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                      >
                        {isOwner && (
                          <option value="admin">Admin</option>
                        )}
                        <option value="member">Member</option>
                      </select>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
                        {searchResults.map((user) => {
                          const userId = String(user._id);

                          return (
                            <div
                              key={userId}
                              className="flex flex-wrap items-center justify-between gap-3 p-4"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {user.name || user.username}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  @{user.username}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={sendingInviteId === userId}
                                onClick={() =>
                                  handleSendInvitation(user)
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                              >
                                {sendingInviteId === userId ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Send size={14} />
                                )}

                                Invite
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Invitation List */}
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-5">
                      <h2 className="font-bold text-slate-900">
                        Workspace invitations
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        View invitation status and manage pending invitations.
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {invitations.map((invitation) => {
                        const invitationId =
                          getInvitationId(invitation);

                        const canRevoke =
                          invitation.status === "pending" &&
                          (isOwner ||
                            (isAdmin && invitation.role === "member"));

                        return (
                          <div
                            key={invitationId}
                            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                @{invitation.invitedUsername || "Unknown user"}
                              </p>

                              <p className="mt-1 text-xs capitalize text-slate-500">
                                Invited as {invitation.role}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Sent {formatDate(invitation.createdAt)}
                                {" · "}
                                Expires {formatDate(invitation.expiresAt)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                                  invitation.status === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : invitation.status === "accepted"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : invitation.status === "revoked"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {invitation.status}
                              </span>

                              {canRevoke && (
                                <button
                                  type="button"
                                  disabled={
                                    revokingInvitationId === invitationId
                                  }
                                  onClick={() =>
                                    handleRevokeInvitation(invitation)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {revokingInvitationId === invitationId
                                    ? "Revoking..."
                                    : "Revoke"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {invitations.length === 0 && (
                        <div className="p-8 text-center">
                          <Mail
                            size={30}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No invitations yet
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Invitations you send will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <section className="space-y-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    General settings
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your workspace information.
                  </p>
                </div>

                <form
                  onSubmit={handleRenameWorkspace}
                  className="space-y-4"
                >
                  <div>
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
                      onChange={(event) =>
                        setWorkspaceName(event.target.value)
                      }
                      maxLength={50}
                      disabled={!isOwner}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Maximum 50 characters. Only the owner can rename this workspace.
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !workspaceName.trim() ||
                        workspaceName.trim() === workspace.name
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}

                      Save changes
                    </button>
                  )}

                  {!isOwner && (
                    <p className="text-xs text-slate-500">
                      Only the workspace owner can change workspace settings.
                    </p>
                  )}
                </form>
              </div>

              {/* Danger Zone */}
              {isOwner && (
                <div className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-50 p-3 text-red-600">
                      <AlertTriangle size={21} />
                    </div>

                    <div>
                      <h2 className="font-bold text-red-700">
                        Danger zone
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Permanent workspace deletion.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-red-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Delete this workspace
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      This action permanently removes the workspace and its memberships.
                      Your API prevents deletion of default workspaces,
                      workspaces containing projects, and workspaces with
                      pending invitations.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteWorkspace}
                    disabled={deleting || workspace.isDefault}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    {workspace.isDefault
                      ? "Default workspace cannot be deleted"
                      : deleting
                        ? "Deleting..."
                        : "Delete workspace"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
