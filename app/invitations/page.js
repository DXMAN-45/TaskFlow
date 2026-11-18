
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Users,
  Clock,
  Mail,
  RefreshCw,
} from "lucide-react";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchInvitations = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/invitations/received");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load invitations.");
      }

      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationAction = async (invitationId, action) => {
    try {
      setActionLoading(`${invitationId}-${action}`);
      setError("");

      const response = await fetch(
        `/api/invitations/${invitationId}/${action}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation.`);
      }

      await fetchInvitations();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  const previousInvitations = invitations.filter(
    (invitation) => invitation.status !== "pending"
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Invitations
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your workspace invitations.
            </p>
          </div>

          <button
            onClick={fetchInvitations}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pending invitations */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Received invitations
            </h2>

            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {pendingInvitations.length} pending
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Mail size={25} className="text-slate-500" />
              </div>

              <h3 className="font-semibold text-slate-800">
                No pending invitations
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                When someone invites you to a workspace, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        <Users size={22} className="text-indigo-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {invitation.workspaceName || "Workspace"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Invited by{" "}
                          <span className="font-semibold text-slate-700">
                            {invitation.inviterUsername || "Unknown user"}
                          </span>
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
                            {invitation.role}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} />
                            Expires {formatDate(invitation.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:shrink-0">
                      <button
                        onClick={() =>
                          handleInvitationAction(invitation._id, "accept")
                        }
                        disabled={actionLoading !== null}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                      >
                        <Check size={16} />
                        {actionLoading === `${invitation._id}-accept`
                          ? "Accepting..."
                          : "Accept"}
                      </button>

                      <button
                        onClick={() =>
                          handleInvitationAction(invitation._id, "decline")
                        }
                        disabled={actionLoading !== null}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                      >
                        <X size={16} />
                        {actionLoading === `${invitation._id}-decline`
                          ? "Declining..."
                          : "Decline"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Previous invitations */}
        {!loading && previousInvitations.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Previous invitations
            </h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {previousInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {invitation.workspaceName || "Workspace"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Invited by {invitation.inviterUsername || "Unknown user"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      invitation.status === "accepted"
                        ? "bg-green-50 text-green-700"
                        : invitation.status === "declined"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {invitation.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
