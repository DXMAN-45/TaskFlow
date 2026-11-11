
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  X,
  ShieldCheck,
  Crown,
  Clock3,
  CheckCircle2,
  CircleDot,
  Filter,
  ChevronDown,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Copy,
  Check,
  Trash2,
  Send,
  UserRound,
  Activity,
  FolderKanban,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

const initialMembers = [
  {
    id: 1,
    name: "Mandeep Singh",
    email: "mandeep@taskflow.demo",
    role: "Owner",
    status: "Active",
    department: "Product",
    joined: "Jan 12, 2026",
    lastActive: "Active now",
    initials: "MS",
    color: "bg-indigo-100 text-indigo-700",
    projects: 4,
    tasks: 12,
  },
  {
    id: 2,
    name: "Riya Sharma",
    email: "riya@taskflow.demo",
    role: "Admin",
    status: "Active",
    department: "Design",
    joined: "Feb 04, 2026",
    lastActive: "Active 12 min ago",
    initials: "RS",
    color: "bg-purple-100 text-purple-700",
    projects: 3,
    tasks: 8,
  },
  {
    id: 3,
    name: "Alex Morgan",
    email: "alex@taskflow.demo",
    role: "Member",
    status: "Active",
    department: "Development",
    joined: "Mar 18, 2026",
    lastActive: "Active 1 hour ago",
    initials: "AM",
    color: "bg-sky-100 text-sky-700",
    projects: 2,
    tasks: 6,
  },
  {
    id: 4,
    name: "Sophia Williams",
    email: "sophia@taskflow.demo",
    role: "Member",
    status: "Active",
    department: "Marketing",
    joined: "Apr 02, 2026",
    lastActive: "Active yesterday",
    initials: "SW",
    color: "bg-rose-100 text-rose-700",
    projects: 2,
    tasks: 5,
  },
  {
    id: 5,
    name: "Daniel Cooper",
    email: "daniel@taskflow.demo",
    role: "Member",
    status: "Active",
    department: "Development",
    joined: "May 21, 2026",
    lastActive: "Active 3 hours ago",
    initials: "DC",
    color: "bg-amber-100 text-amber-700",
    projects: 1,
    tasks: 4,
  },
];

const initialInvitations = [
  {
    id: 101,
    email: "james@taskflow.demo",
    role: "Member",
    status: "Pending",
    sent: "Nov 10, 2026",
  },
  {
    id: 102,
    email: "emma@taskflow.demo",
    role: "Admin",
    status: "Pending",
    sent: "Nov 09, 2026",
  },
];

const roleStyles = {
  Owner: "bg-amber-50 text-amber-700 border-amber-200",
  Admin: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Member: "bg-slate-100 text-slate-600 border-slate-200",
};

const memberColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
];

const tabs = ["All members", "Admins", "Members", "Invitations"];

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        roleStyles[role] || roleStyles.Member
      }`}
    >
      {role === "Owner" ? (
        <Crown size={12} />
      ) : role === "Admin" ? (
        <ShieldCheck size={12} />
      ) : (
        <UserRound size={12} />
      )}
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isActive ? "text-emerald-700" : "text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}

function Avatar({ member, size = "normal" }) {
  const sizeClass =
    size === "large"
      ? "h-16 w-16 text-lg"
      : size === "small"
      ? "h-8 w-8 text-[10px]"
      : "h-10 w-10 text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${sizeClass} ${
        member.color || "bg-indigo-100 text-indigo-700"
      }`}
    >
      {member.initials || getInitials(member.name)}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);

  const [activeTab, setActiveTab] = useState("All members");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [notice, setNotice] = useState("");

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "Member",
  });

  const [copiedEmail, setCopiedEmail] = useState(false);

  const activeMembers = members.filter(
    (member) => member.status === "Active"
  ).length;

  const adminCount = members.filter(
    (member) => member.role === "Admin" || member.role === "Owner"
  ).length;

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (activeTab === "Admins") {
      result = result.filter(
        (member) => member.role === "Admin" || member.role === "Owner"
      );
    } else if (activeTab === "Members") {
      result = result.filter((member) => member.role === "Member");
    }

    if (roleFilter !== "All roles" && activeTab !== "Invitations") {
      result = result.filter((member) => member.role === roleFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((member) =>
        [member.name, member.email, member.department, member.role]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [members, activeTab, roleFilter, search]);

  const filteredInvitations = useMemo(() => {
    if (!search.trim()) return invitations;

    return invitations.filter((invitation) =>
      invitation.email.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [invitations, search]);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const handleInvite = (event) => {
    event.preventDefault();

    const email = inviteForm.email.trim().toLowerCase();

    if (!email) return;

    const alreadyMember = members.some(
      (member) => member.email.toLowerCase() === email
    );

    const alreadyInvited = invitations.some(
      (invitation) => invitation.email.toLowerCase() === email
    );

    if (alreadyMember || alreadyInvited) {
      notify("This email is already a member or has a pending invitation.");
      return;
    }

    const invitation = {
      id: Date.now(),
      email,
      role: inviteForm.role,
      status: "Pending",
      sent: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    setInvitations((previous) => [invitation, ...previous]);
    setInviteForm({ email: "", role: "Member" });
    setShowInviteModal(false);
    setActiveTab("Invitations");
    notify("Demo invitation added to your pending invitations.");
  };

  const cancelInvitation = (id) => {
    setInvitations((previous) =>
      previous.filter((invitation) => invitation.id !== id)
    );
    setOpenMenu(null);
    notify("Invitation removed.");
  };

  const resendInvitation = () => {
    setOpenMenu(null);
    notify("Demo invitation marked as resent.");
  };

  const updateMemberRole = (memberId, role) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === memberId ? { ...member, role } : member
      )
    );

    setSelectedMember((previous) =>
      previous?.id === memberId ? { ...previous, role } : previous
    );

    setOpenMenu(null);
    notify("Member role updated in demo data.");
  };

  const removeMember = (memberId) => {
    const member = members.find((item) => item.id === memberId);

    if (!member || member.role === "Owner") {
      notify("The workspace owner cannot be removed.");
      return;
    }

    setMembers((previous) =>
      previous.filter((item) => item.id !== memberId)
    );

    setOpenMenu(null);
    setShowMemberModal(false);
    setSelectedMember(null);
    notify("Member removed from demo workspace.");
  };

  const openMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
    setOpenMenu(null);
  };

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
      notify("Email copied to clipboard.");
    } catch {
      notify("Clipboard access is unavailable in this browser.");
    }
  };

  return (
    <main
      className="flex h-dvh w-full overflow-hidden bg-[#f7f8fc] text-slate-800"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar active="team" />
      </div>

      {/* Mobile sidebar: fixed width is accounted for in content margin */}
      <div className="lg:hidden">
        <Sidebarmob active="team" />
      </div>

      <section className="ml-[76px] flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7 lg:px-9">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Workspace / Team
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Team
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Workspace active
            </span>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:px-4"
            >
              <UserPlus size={17} />
              <span className="hidden sm:inline">Invite member</span>
              <span className="sm:hidden">Invite</span>
            </button>
          </div>
        </header>

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-[1450px]">
            {/* Page heading */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Your team, together.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  See who is part of your workspace, manage access, and keep
                  everyone moving in the same direction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="hidden h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
              >
                <Plus size={17} />
                Add teammate
              </button>
            </div>

            {/* Team summary cards */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total members"
                value={members.length}
                detail="People in this workspace"
                icon={<Users size={21} />}
                iconClass="bg-indigo-50 text-indigo-600"
              />

              <SummaryCard
                label="Active members"
                value={activeMembers}
                detail="Currently active accounts"
                icon={<CheckCircle2 size={21} />}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <SummaryCard
                label="Admins"
                value={adminCount}
                detail="Owners and administrators"
                icon={<ShieldCheck size={21} />}
                iconClass="bg-violet-50 text-violet-600"
              />

              <SummaryCard
                label="Pending invites"
                value={invitations.length}
                detail="Waiting to be accepted"
                icon={<Mail size={21} />}
                iconClass="bg-amber-50 text-amber-600"
              />
            </div>

            {/* Members area */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Section heading */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Workspace members
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Manage your people and their access.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1 sm:w-64">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <label className="sr-only" htmlFor="team-search">
                      Search team members
                    </label>
                    <input
                      id="team-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or email..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base outline-none transition focus:border-indigo-400 focus:bg-white sm:text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={roleFilter}
                      onChange={(event) => setRoleFilter(event.target.value)}
                      aria-label="Filter by role"
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400 sm:w-auto"
                    >
                      <option>All roles</option>
                      <option>Owner</option>
                      <option>Admin</option>
                      <option>Member</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-5 overflow-x-auto border-b border-slate-100 px-5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const count =
                    tab === "All members"
                      ? members.length
                      : tab === "Admins"
                      ? adminCount
                      : tab === "Members"
                      ? members.filter((item) => item.role === "Member").length
                      : invitations.length;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setOpenMenu(null);
                      }}
                      className={`relative flex shrink-0 items-center gap-2 py-4 text-sm font-semibold transition ${
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>

                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Members table / invitation list */}
              {activeTab === "Invitations" ? (
                <div>
                  {filteredInvitations.length === 0 ? (
                    <EmptyState
                      title="No pending invitations"
                      description="Invitations you send will appear here."
                      action={() => setShowInviteModal(true)}
                    />
                  ) : (
                    <>
                      <div className="hidden grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_60px] gap-4 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 md:grid">
                        <span>Email</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Sent</span>
                        <span />
                      </div>

                      {filteredInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_60px] md:items-center md:gap-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                              <Mail size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {invitation.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-400 md:hidden">
                                Invitation sent {invitation.sent}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-slate-600">
                              {invitation.role}
                            </span>
                          </div>

                          <div>
                            <StatusBadge status="Pending" />
                          </div>

                          <div className="hidden text-xs text-slate-500 md:block">
                            {invitation.sent}
                          </div>

                          <div className="flex items-center gap-2 md:justify-end">
                            <button
                              type="button"
                              onClick={resendInvitation}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Resend
                            </button>

                            <button
                              type="button"
                              onClick={() => cancelInvitation(invitation.id)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Cancel invitation for ${invitation.email}`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : filteredMembers.length === 0 ? (
                <EmptyState
                  title="No members found"
                  description="Try another search term or change the selected filter."
                  action={() => {
                    setSearch("");
                    setRoleFilter("All roles");
                    setActiveTab("All members");
                  }}
                  actionLabel="Clear filters"
                />
              ) : (
                <>
                  {/* Desktop table header */}
                  <div className="hidden grid-cols-[minmax(220px,1.6fr)_1fr_1fr_1fr_1fr_48px] gap-4 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
                    <span>Member</span>
                    <span>Role</span>
                    <span>Department</span>
                    <span>Status</span>
                    <span>Last active</span>
                    <span />
                  </div>

                  {/* Member rows */}
                  <div>
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="group grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50/70 last:border-0 lg:grid-cols-[minmax(220px,1.6fr)_1fr_1fr_1fr_1fr_48px] lg:items-center lg:gap-4"
                      >
                        {/* Member identity */}
                        <button
                          type="button"
                          onClick={() => openMember(member)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <Avatar member={member} />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800 transition group-hover:text-indigo-600">
                              {member.name}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-400">
                              {member.email}
                            </span>
                          </span>
                        </button>

                        <div>
                          <RoleBadge role={member.role} />
                        </div>

                        <div className="text-xs font-medium text-slate-600">
                          <span className="text-slate-400 lg:hidden">
                            Department:{" "}
                          </span>
                          {member.department}
                        </div>

                        <div>
                          <StatusBadge status={member.status} />
                        </div>

                        <div className="text-xs text-slate-500">
                          <span className="lg:hidden">Last active: </span>
                          {member.lastActive}
                        </div>

                        {/* Member actions */}
                        <div className="relative flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenu(
                                openMenu === member.id ? null : member.id
                              );
                            }}
                            aria-label={`Actions for ${member.name}`}
                            aria-expanded={openMenu === member.id}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal size={19} />
                          </button>

                          {openMenu === member.id && (
                            <div
                              onClick={(event) => event.stopPropagation()}
                              className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                            >
                              <button
                                type="button"
                                onClick={() => openMember(member)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <UserRound size={15} />
                                View profile
                              </button>

                              {member.role !== "Owner" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateMemberRole(
                                        member.id,
                                        member.role === "Admin"
                                          ? "Member"
                                          : "Admin"
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                                  >
                                    <ShieldCheck size={15} />
                                    {member.role === "Admin"
                                      ? "Remove admin role"
                                      : "Make admin"}
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={() => removeMember(member.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={15} />
                                    Remove member
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mobile detail shortcuts */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 lg:hidden">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <FolderKanban size={13} />
                            {member.projects} projects
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 size={13} />
                            {member.tasks} tasks
                          </span>
                          <button
                            type="button"
                            onClick={() => openMember(member)}
                            className="ml-auto text-xs font-semibold text-indigo-600"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  {activeTab === "Invitations"
                    ? `${filteredInvitations.length} pending invitations`
                    : `Showing ${filteredMembers.length} of ${members.length} members`}
                </p>
                <span className="text-xs font-medium text-slate-500">
                  Demo workspace
                </span>
              </div>
            </div>

            {/* Workspace information */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BriefcaseBusiness size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Workspace access
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Owners manage the workspace. Admins can help manage
                      members and projects. Members can collaborate on
                      assigned work.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Activity size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Keep your team in sync
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Invite the people working on your projects so tasks,
                      updates, and responsibilities stay in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-slate-400">
              TaskFlow © 2026. Better work happens together.
            </footer>
          </div>
        </div>
      </section>

      {/* Invite modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto scrollbar-hide bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowInviteModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Invite your teammate
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Add someone to your TaskFlow workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close invite dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm({
                      ...inviteForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="name@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Workspace role
                </label>

                <select
                  id="invite-role"
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm({
                      ...inviteForm,
                      role: event.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Admins can help manage workspace members and projects.
                  Members collaborate on their assigned work.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex gap-2.5">
                  <Mail size={17} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-xs leading-5 text-slate-500">
                    This is a demo invitation. It will be added to the pending
                    invitations list but no email will actually be sent.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Send size={15} />
                  Send invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member details modal */}
      {showMemberModal && selectedMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto scrollbar-hide bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowMemberModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-violet-500">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="absolute right-4 top-4 rounded-lg bg-white/15 p-2 text-white hover:bg-white/25"
                aria-label="Close member profile"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="-mt-9 flex items-end justify-between">
                <Avatar member={selectedMember} size="large" />
                <StatusBadge status={selectedMember.status} />
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedMember.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedMember.email}
                </p>
                <div className="mt-3">
                  <RoleBadge role={selectedMember.role} />
                </div>
              </div>

              <div className="my-5 grid grid-cols-2 gap-3">
                <MemberMetric
                  icon={<FolderKanban size={17} />}
                  label="Projects"
                  value={selectedMember.projects}
                />
                <MemberMetric
                  icon={<CheckCircle2 size={17} />}
                  label="Assigned tasks"
                  value={selectedMember.tasks}
                />
              </div>

              <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                <DetailLine
                  icon={<BriefcaseBusiness size={16} />}
                  label="Department"
                  value={selectedMember.department}
                />
                <DetailLine
                  icon={<CalendarDays size={16} />}
                  label="Joined"
                  value={selectedMember.joined}
                />
                <DetailLine
                  icon={<Clock3 size={16} />}
                  label="Last active"
                  value={selectedMember.lastActive}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => copyEmail(selectedMember.email)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {copiedEmail ? <Check size={16} /> : <Copy size={16} />}
                  {copiedEmail ? "Copied" : "Copy email"}
                </button>

                {selectedMember.role !== "Owner" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateMemberRole(
                        selectedMember.id,
                        selectedMember.role === "Admin"
                          ? "Member"
                          : "Admin"
                      )
                    }
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <ShieldCheck size={16} />
                    {selectedMember.role === "Admin"
                      ? "Make member"
                      : "Make admin"}
                  </button>
                )}
              </div>

              {selectedMember.role !== "Owner" && (
                <button
                  type="button"
                  onClick={() => removeMember(selectedMember.id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                  Remove from workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[150] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl"
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value, detail, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
  actionLabel = "Invite a member",
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users size={25} />
      </div>
      <h4 className="font-bold text-slate-800">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      <button
        type="button"
        onClick={action}
        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function MemberMetric({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DetailLine({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <span className="max-w-[55%] truncate text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
