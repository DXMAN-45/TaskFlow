
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  FolderKanban,
  CheckCircle2,
  CalendarDays,
  MoreHorizontal,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  Crown,
  BriefcaseBusiness,
  Target,
  Flag,
  Activity,
  Trash2,
  Pencil,
  Clock3,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

const projectColors = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600",
    bar: "bg-indigo-600",
    accent: "bg-indigo-500",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    bar: "bg-violet-600",
    accent: "bg-violet-500",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600",
    bar: "bg-sky-600",
    accent: "bg-sky-500",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-600",
    accent: "bg-emerald-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    bar: "bg-rose-600",
    accent: "bg-rose-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    bar: "bg-amber-600",
    accent: "bg-amber-500",
  },
};

const statusStyles = {
  "Not started": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Archived: "bg-slate-100 text-slate-500",
};

const taskStatusStyles = {
  "To do": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
};

const priorityStyles = {
  Urgent: "text-rose-700 bg-rose-50",
  High: "text-red-600 bg-red-50",
  Medium: "text-amber-700 bg-amber-50",
  Low: "text-emerald-700 bg-emerald-50",
};

const filters = [
  "All projects",
  "Not started",
  "In progress",
  "Completed",
  "Archived",
];

const defaultProjectForm = {
  name: "",
  description: "",
  category: "Product Development",
  priority: "Medium",
  deadline: "",
  color: "indigo",
};

const defaultTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  dueDate: "",
};

// HELPERS
function todayString() {
  const date = new Date();
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "No deadline";

  const parsedDate = String(date).includes("T")
    ? new Date(date)
    : new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "No deadline";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTasks(project) {
  return Array.isArray(project?.tasks) ? project.tasks : [];
}

function getCompletedCount(project) {
  return getTasks(project).filter(
    (task) => task.status === "Completed"
  ).length;
}

function getProgress(project) {
  const tasks = getTasks(project);

  return tasks.length
    ? Math.round((getCompletedCount(project) / tasks.length) * 100)
    : 0;
}

function getProjectStatus(project) {
  if (project.archived) return "Archived";

  const tasks = getTasks(project);

  if (!tasks.length) return "Not started";

  if (tasks.every((task) => task.status === "Completed")) {
    return "Completed";
  }

  if (
    tasks.some(
      (task) =>
        task.status === "In progress" ||
        task.status === "Completed"
    )
  ) {
    return "In progress";
  }

  return "Not started";
}

function getTaskStatus(task) {
  if (task.status === "Completed") return "Completed";

  if (task.dueDate && task.dueDate < todayString()) {
    return "Overdue";
  }

  return task.status || "To do";
}

function getDaysRemaining(date) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${date}T00:00:00`);

  return Math.ceil((deadline - today) / 86400000);
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getMember(project, userId) {
  return project.members?.find(
    (member) => member.userId === userId
  );
}

function getCurrentRole(project, currentUserId) {
  if (!currentUserId) return null;
  return getMember(project, currentUserId)?.role || null;
}

function canCreateTask(project, currentUserId) {
  const role = getCurrentRole(project, currentUserId);
  return role === "owner" || role === "admin";
}

function canManageProject(project, currentUserId) {
  return canCreateTask(project, currentUserId);
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] || statusStyles["Not started"]
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        priorityStyles[priority] || priorityStyles.Medium
      }`}
    >
      <Flag size={11} />
      {priority}
    </span>
  );
}

function ProjectAvatars({ members = [], max = 3 }) {
  return (
    <div className="flex items-center">
      {members.slice(0, max).map((member, index) => (
        <div
          key={member.userId}
          title={`${member.name} · ${member.role}`}
          className={`-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold first:ml-0 ${
            [
              "bg-indigo-100 text-indigo-700",
              "bg-purple-100 text-purple-700",
              "bg-sky-100 text-sky-700",
              "bg-emerald-100 text-emerald-700",
              "bg-amber-100 text-amber-700",
            ][index % 5]
          }`}
        >
          {getInitials(member.name || "Member")}
        </div>
      ))}

      {members.length > max && (
        <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-500">
          +{members.length - max}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, color = "indigo" }) {
  const style = projectColors[color] || projectColors.indigo;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
        style={{
          width: `${Math.max(0, Math.min(value, 100))}%`,
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value, detail, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
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


function ProjectCard({
  project,
  onOpen,
  onMenu,
  menuOpen,
  onEdit,
  onArchive,
  onDelete,
  currentUserId,
}) {
  const colors =
    projectColors[project.color] || projectColors.indigo;

  const remaining = getDaysRemaining(project.deadline);
  const status = getProjectStatus(project);
  const canManage = canManageProject(project, currentUserId);
  const isOwner = getCurrentRole(project, currentUserId) === "owner";

  return (
    <article className="group relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}
        >
          <FolderKanban size={22} />
        </div>

        {canManage && (
          <div className="relative">
            <button
              type="button"
              aria-label={`More options for ${project.name}`}
              aria-expanded={menuOpen}
              onClick={(event) => {
                event.stopPropagation();
                onMenu(project.id);
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <MoreHorizontal size={19} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit project
                </button>

                <button
                  type="button"
                  onClick={() => onArchive(project)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FolderKanban size={14} />
                  {project.archived
                    ? "Restore project"
                    : "Archive project"}
                </button>

                {isOwner && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => onDelete(project)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete project
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(project)}
        className="text-left"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-slate-400">
            {project.category}
          </span>
        </div>

        <h3 className="truncate text-lg font-bold text-slate-900 transition group-hover:text-indigo-600">
          {project.name}
        </h3>

        <p className="mt-2 min-h-[42px] line-clamp-2 text-sm leading-5 text-slate-500">
          {project.description}
        </p>
      </button>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Project progress
          </span>
          <span className="text-xs font-bold tabular-nums text-slate-800">
            {getProgress(project)}%
          </span>
        </div>

        <ProgressBar
          value={getProgress(project)}
          color={project.color}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs text-slate-400">Tasks completed</p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {getCompletedCount(project)}
            <span className="ml-1 font-medium text-slate-400">
              / {getTasks(project).length}
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Deadline</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {formatDate(project.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <ProjectAvatars members={project.members || []} />

        <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays size={13} />
          {remaining === null
            ? "No date"
            : remaining < 0
              ? `${Math.abs(remaining)} days overdue`
              : remaining === 0
                ? "Due today"
                : `${remaining} days left`}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(project)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        View project
        <ArrowUpRight size={14} />
      </button>
    </article>
  );
}


export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState({ id: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All projects");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [viewMode, setViewMode] = useState("grid");

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [notice, setNotice] = useState("");

  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);

  const [workspaceMembers, setWorkspaceMembers] = useState([]);
const [selectedMemberIds, setSelectedMemberIds] = useState([]);
const [membersLoading, setMembersLoading] = useState(false);

  const refreshData = useCallback(async () => {
    const [projectsResponse, tasksResponse, sessionResponse] = await Promise.all([
      fetch("/api/projects", { cache: "no-store" }),
      fetch("/api/tasks", { cache: "no-store" }),
      fetch("/api/auth/session", { cache: "no-store" }),
    ]);

    const [projectsData, tasksData, sessionData] = await Promise.all([
      projectsResponse.json(),
      tasksResponse.json(),
      sessionResponse.json(),
    ]);

    if (!projectsResponse.ok) {
      throw new Error(projectsData.error || "Could not load projects.");
    }
    if (!tasksResponse.ok) {
      throw new Error(tasksData.error || "Could not load tasks.");
    }

    const userId = String(sessionData?.user?.id || "");
    const userName = sessionData?.user?.name || sessionData?.user?.email || "You";
    setCurrentUser({ id: userId, name: userName });

    const taskRows = Array.isArray(tasksData)
      ? tasksData
      : Array.isArray(tasksData.tasks)
        ? tasksData.tasks
        : [];

    const normalizedTasks = taskRows.map((task) => ({
      ...task,
      id: String(task._id || task.id),
      projectId: task.projectId ? String(task.projectId) : null,
      assignedTo: task.assignedTo ? String(task.assignedTo) : "",
      createdBy: task.createdBy ? String(task.createdBy) : "",
      dueDate: task.dueDate || "",
    }));

    const projectRows = Array.isArray(projectsData)
      ? projectsData
      : Array.isArray(projectsData.projects)
        ? projectsData.projects
        : [];

    const normalizedProjects = projectRows.map((project) => {
      const ownerId = String(project.ownerId || "");
      const rawMembers = Array.isArray(project.members) ? project.members : [];
      const members = rawMembers.map((member) => {
        const memberId = String(member.userId || member._id || member.id || "");
        const role = member.role || (memberId === ownerId ? "owner" : "member");
        return {
          userId: memberId,
          name: member.name || member.displayName || (memberId === userId ? userName : `Member ${memberId.slice(-4)}`),
          role,
        };
      });

      if (ownerId && !members.some((member) => member.userId === ownerId)) {
        members.unshift({
          userId: ownerId,
          name: ownerId === userId ? userName : `Member ${ownerId.slice(-4)}`,
          role: "owner",
        });
      }

      return {
        ...project,
        id: String(project._id || project.id),
        ownerId,
        name: project.name || "Untitled project",
        description: project.description || "",
        category: project.category || "Other",
        priority: project.priority || "Medium",
        color: project.color || "indigo",
        deadline: project.deadline || "",
        createdAt: project.createdAt || "",
        archived: Boolean(project.archived),
        members,
        tasks: normalizedTasks.filter((task) => task.projectId === String(project._id || project.id)),
      };
    });

    setProjects(normalizedProjects);
    setSelectedProject((previous) => {
      if (!previous) return previous;
      return normalizedProjects.find((project) => project.id === previous.id) || null;
    });
  }, []);

useEffect(() => {
  if (!showProjectModal || editingId) return;

  let active = true;

  const fetchWorkspaceMembers = async () => {
    try {
      setMembersLoading(true);

      const response = await fetch("/api/workspaces/members", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load workspace members."
        );
      }

      if (active) {
        setWorkspaceMembers(
          (data.members || []).filter(
            (member) => member.userId !== currentUser.id
          )
        );
      }
    } catch (error) {
      if (active) {
        notify(error.message);
      }
    } finally {
      if (active) {
        setMembersLoading(false);
      }
    }
  };

  fetchWorkspaceMembers();

  return () => {
    active = false;
  };
}, [showProjectModal, editingId, currentUser.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        await refreshData();
      } catch (error) {
        if (active) setLoadError(error.message || "Something went wrong while loading projects.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshData]);

  const activeProjectsList = projects.filter(
    (project) => !project.archived
  );

  const totalProjects = activeProjectsList.length;

  const activeProjects = activeProjectsList.filter(
    (project) => getProjectStatus(project) === "In progress"
  ).length;

  const completedProjects = activeProjectsList.filter(
    (project) => getProjectStatus(project) === "Completed"
  ).length;

  const totalTasks = activeProjectsList.reduce(
    (sum, project) => sum + getTasks(project).length,
    0
  );

  const completedTasks = activeProjectsList.reduce(
    (sum, project) => sum + getCompletedCount(project),
    0
  );

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (activeFilter === "All projects") {
      result = result.filter((project) => !project.archived);
    } else if (activeFilter === "Archived") {
      result = result.filter((project) => project.archived);
    } else {
      result = result.filter(
        (project) => getProjectStatus(project) === activeFilter
      );
    }

    if (priorityFilter !== "All priorities") {
      result = result.filter(
        (project) => project.priority === priorityFilter
      );
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((project) =>
        [
          project.name,
          project.description,
          project.category,
          project.priority,
          getProjectStatus(project),
          ...(project.members || []).map((member) => member.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [projects, activeFilter, priorityFilter, search]);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  // CREATE / EDIT PROJECT
const startCreateProject = () => {
  setProjectForm(defaultProjectForm);
  setSelectedMemberIds([]);
  setEditingId(null);
  setShowProjectModal(true);
  setOpenMenu(null);
};
  const startEditProject = (project) => {
    if (!canManageProject(project, currentUser.id)) {
      notify("Only project owners and admins can edit this project.");
      return;
    }

    setProjectForm({
      name: project.name,
      description: project.description,
      category: project.category,
      priority: project.priority,
      deadline: project.deadline || "",
      color: project.color || "indigo",
    });

    setEditingId(project.id);
    setShowProjectModal(true);
    setOpenMenu(null);
  };

  const handleSaveProject = async (event) => {
    event.preventDefault();
    const name = projectForm.name.trim();
    if (!name) return;

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/projects/${editingId}` : "/api/projects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  ...projectForm,
  name,
  ...(editingId ? {} : { memberIds: selectedMemberIds }),
}),
        }
      );
      const data = await response.json();
     if (!response.ok) {
  throw new Error(
    data.message || data.error || "Could not save project."
  );
}

      await refreshData();
      setShowProjectModal(false);
      setEditingId(null);
      setProjectForm(defaultProjectForm);
      notify(editingId ? "Project updated successfully." : "Project created successfully.");
    } catch (error) {
      notify(error.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  };

  // OPEN PROJECT DETAILS
  const openProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
    setOpenMenu(null);
  };

  // ARCHIVE / RESTORE PROJECT
  const toggleArchive = async (project) => {
    if (!canManageProject(project, currentUser.id)) {
      notify("Only project owners and admins can archive this project.");
      return;
    }
    const nextArchived = !project.archived;
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update project.");
      await refreshData();
      setOpenMenu(null);
      notify(nextArchived ? "Project archived." : "Project restored.");
    } catch (error) {
      notify(error.message || "Could not update project.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE PROJECT — OWNER ONLY
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (getCurrentRole(deleteTarget, currentUser.id) !== "owner") {
      notify("Only the project owner can delete this project.");
      setDeleteTarget(null);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete project.");
      if (selectedProject?.id === deleteTarget.id) {
        setShowDetailsModal(false);
        setSelectedProject(null);
      }
      setDeleteTarget(null);
      setOpenMenu(null);
      await refreshData();
      notify("Project and its tasks deleted successfully.");
    } catch (error) {
      notify(error.message || "Could not delete project.");
    } finally {
      setSaving(false);
    }
  };

  // CREATE PROJECT TASK — OWNER / ADMIN ONLY
  const startCreateTask = () => {
    if (!selectedProject || !canCreateTask(selectedProject, currentUser.id)) {
      notify("Only project owners and admins can create tasks.");
      return;
    }

    setTaskForm({
      ...defaultTaskForm,
      assignedTo: selectedProject.members?.[0]?.userId || "",
    });

    setShowTaskModal(true);
  };

  const handleCreateProjectTask = async (event) => {
    event.preventDefault();
    if (!selectedProject || !canCreateTask(selectedProject, currentUser.id)) {
      notify("You do not have permission to create tasks in this project.");
      return;
    }
    const validAssignee = selectedProject.members?.some((member) => member.userId === taskForm.assignedTo);
    if (!validAssignee) {
      notify("Choose a member of this project.");
      return;
    }
    const title = taskForm.title.trim();
    if (!title) return;

    setSaving(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: taskForm.description.trim(),
          projectId: selectedProject.id,
          assignedTo: taskForm.assignedTo,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create task.");
      await refreshData();
      setShowTaskModal(false);
      setTaskForm(defaultTaskForm);
      notify("Task created in this project.");
    } catch (error) {
      notify(error.message || "Could not create task.");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE TASK STATUS — OWNER / ADMIN ONLY
  const updateTaskStatus = async (taskId, nextStatus) => {
    if (!selectedProject || !canManageProject(selectedProject, currentUser.id)) {
      notify("Only project owners and admins can update task status.");
      return;
    }
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update task.");
      await refreshData();
    } catch (error) {
      notify(error.message || "Could not update task.");
      await refreshData();
    }
  };

  // OPEN TASK DELETE CONFIRMATION
  const requestDeleteTask = (task) => {
    if (!selectedProject || !canManageProject(selectedProject, currentUser.id)) {
      notify("Only project owners and admins can delete tasks.");
      return;
    }

    setDeleteTaskTarget(task);
  };

  // CONFIRM TASK DELETE — OWNER / ADMIN ONLY
  const confirmDeleteTask = async () => {
    if (!selectedProject || !deleteTaskTarget) return;
    if (!canManageProject(selectedProject, currentUser.id)) {
      notify("Only project owners and admins can delete tasks.");
      setDeleteTaskTarget(null);
      return;
    }
    try {
      const response = await fetch(`/api/tasks/${deleteTaskTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete task.");
      setDeleteTaskTarget(null);
      await refreshData();
      notify("Task deleted successfully.");
    } catch (error) {
      notify(error.message || "Could not delete task.");
    }
  };

  const snapshot = [
    {
      label: "Not started",
      count: activeProjectsList.filter(
        (project) => getProjectStatus(project) === "Not started"
      ).length,
      color: "bg-slate-400",
    },
    {
      label: "In progress",
      count: activeProjectsList.filter(
        (project) => getProjectStatus(project) === "In progress"
      ).length,
      color: "bg-blue-500",
          },
    {
      label: "Completed",
      count: activeProjectsList.filter(
        (project) => getProjectStatus(project) === "Completed"
      ).length,
      color: "bg-emerald-500",
    },
  ];

  return (
    <main
      className="flex h-dvh w-full overflow-hidden bg-[#f7f8fc] text-slate-800"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      <div className="hidden shrink-0 lg:block">
        <Sidebar active="projects" />
      </div>

      <div className="lg:hidden">
        <Sidebarmob active="projects" />
      </div>

      <section className="ml-[76px] flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        {/* HEADER */}
        <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7 lg:px-9">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Workspace / Projects
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Projects
            </h1>
          </div>

          <button
            type="button"
            onClick={startCreateProject}
            disabled={loading || !currentUser.id}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:px-4"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New project</span>
            <span className="sm:hidden">Create</span>
          </button>
        </header>

        {loadError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {loadError}{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* PAGE BODY */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Your work, in one place.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Bring your projects into one clear view. Track progress,
                  see who&apos;s involved, and keep the next steps visible.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Workspace overview
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total projects"
                value={totalProjects}
                detail="Across your workspace"
                icon={<FolderKanban size={21} />}
                iconClass="bg-indigo-50 text-indigo-600"
              />

              <SummaryCard
                label="In progress"
                value={activeProjects}
                detail="Projects currently moving"
                icon={<Activity size={21} />}
                iconClass="bg-blue-50 text-blue-600"
              />

              <SummaryCard
                label="Completed"
                value={completedProjects}
                detail="Successfully finished"
                icon={<CheckCircle2 size={21} />}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <SummaryCard
                label="Tasks completed"
                value={`${completedTasks}/${totalTasks}`}
                detail="Across all active projects"
                icon={<Target size={21} />}
                iconClass="bg-violet-50 text-violet-600"
              />
            </div>

            {/* WORKSPACE PROGRESS + SNAPSHOT */}
            <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Workspace progress
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Combined task completion across projects
                    </p>
                  </div>

                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <Target size={19} />
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-extrabold tabular-nums text-slate-900">
                      {totalTasks
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0}
                      %
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Overall completion
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    {completedTasks} of {totalTasks} tasks
                  </p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{
                      width: `${
                        totalTasks
                          ? (completedTasks / totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    Completed
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                    Remaining
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Project snapshot
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Current workspace status
                    </p>
                  </div>
                  <LayoutGrid size={19} className="text-slate-400" />
                </div>

                <div className="mt-5 space-y-4">
                  {snapshot.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                        />
                        <span className="text-xs font-medium text-slate-600">
                          {item.label}
                        </span>
                      </div>

                      <span className="text-sm font-bold tabular-nums text-slate-800">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PROJECT LIST */}
            <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    All projects
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Browse and manage your workspace projects.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1 sm:w-64">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <label htmlFor="project-search" className="sr-only">
                      Search projects
                    </label>

                    <input
                      id="project-search"
                      type="search"
                      placeholder="Search projects..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base outline-none transition focus:border-indigo-400 focus:bg-white sm:text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(event.target.value)
                      }
                      aria-label="Filter projects by priority"
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400 sm:w-auto"
                    >
                      <option>All priorities</option>
                      <option>Urgent</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  <div className="flex items-center rounded-xl border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                      className={`flex h-8 w-9 items-center justify-center rounded-lg transition ${
                        viewMode === "grid"
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <LayoutGrid size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                      className={`flex h-8 w-9 items-center justify-center rounded-lg transition ${
                        viewMode === "list"
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* FILTERS */}
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
                {filters.map((filter) => {
                  const count =
                    filter === "All projects"
                      ? projects.filter((project) => !project.archived).length
                      : filter === "Archived"
                        ? projects.filter((project) => project.archived).length
                        : projects.filter(
                            (project) => getProjectStatus(project) === filter
                          ).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        activeFilter === filter
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {filter}
                      <span className="opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* PROJECT CARDS */}
              <div className="p-4 sm:p-5">
                {loading ? (
                  <div className="flex min-h-64 items-center justify-center text-sm font-medium text-slate-400">Loading your projects...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FolderKanban size={25} />
                    </div>

                    <h4 className="font-bold text-slate-800">
                      No projects found
                    </h4>

                    <p className="mt-1 max-w-sm text-sm text-slate-400">
                      Try another search or change your filters to see more
                      projects.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setPriorityFilter("All priorities");
                        setActiveFilter("All projects");
                      }}
                      className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onOpen={openProject}
                        menuOpen={openMenu === project.id}
                        onMenu={(id) =>
                          setOpenMenu(openMenu === id ? null : id)
                        }
                        onEdit={startEditProject}
                        onArchive={toggleArchive}
                        onDelete={setDeleteTarget}
                        currentUserId={currentUser.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-indigo-200 hover:bg-slate-50/50 sm:flex-row sm:items-center"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            (projectColors[project.color] ||
                              projectColors.indigo).icon
                          }`}
                        >
                          <FolderKanban size={21} />
                        </div>

                        <button
                          type="button"
                          onClick={() => openProject(project)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-slate-800">
                              {project.name}
                            </span>
                            <StatusBadge
                              status={getProjectStatus(project)}
                            />
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {project.description}
                          </p>
                        </button>

                        <div className="w-full sm:w-36">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Progress</span>
                            <span className="font-bold text-slate-700">
                              {getProgress(project)}%
                            </span>
                          </div>

                          <ProgressBar
                            value={getProgress(project)}
                            color={project.color}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:w-40 sm:justify-end">
                          <ProjectAvatars
                            members={project.members || []}
                          />

                          <span className="text-xs text-slate-400">
                            {getCompletedCount(project)}/
                            {getTasks(project).length} tasks
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openProject(project)}
                          aria-label={`View ${project.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-xs text-slate-400">
                  Showing {filteredProjects.length} of {projects.length} projects
                </p>

                <span className="text-xs font-medium text-slate-500">
                  Live workspace
                </span>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-slate-400">
              TaskFlow © 2026. Keep every project moving.
            </footer>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT PROJECT MODAL */}
      {showProjectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                            setShowProjectModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderKanban size={20} />
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit project" : "Create a project"}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Give your team a clear place to work together.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                aria-label="Close project form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Project name *
                </label>

                <input
                  id="project-name"
                  required
                  autoFocus
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Website redesign"
                  className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  rows={3}
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-xl border border-slate-200 p-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="project-category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Category
                  </label>

                  <select
                    id="project-category"
                    value={projectForm.category}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        category: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  >
                    <option>Product Development</option>
                    <option>Design & UX</option>
                    <option>Development</option>
                    <option>Operations</option>
                    <option>Marketing</option>
                    <option>Documentation</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="project-priority"
                    value={projectForm.priority}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        priority: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="project-deadline"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Deadline
                  </label>

                  <input
                    id="project-deadline"
                    type="date"
                    value={projectForm.deadline}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        deadline: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

{!editingId && (
  <div className="rounded-xl border border-slate-200 p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">
          Project members
        </h4>
        <p className="mt-1 text-xs text-slate-400">
          Select workspace members to collaborate.
        </p>
      </div>

      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
        {selectedMemberIds.length} selected
      </span>
    </div>

    <div className="max-h-52 space-y-2 overflow-y-auto">
      {membersLoading ? (
        <p className="py-4 text-center text-sm text-slate-400">
          Loading workspace members...
        </p>
      ) : workspaceMembers.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No other workspace members available.
        </p>
      ) : (
        workspaceMembers.map((member) => {
          const checked = selectedMemberIds.includes(member.userId);

          return (
            <label
              key={member.userId}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                checked
                  ? "border-indigo-200 bg-indigo-50/60"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  setSelectedMemberIds((previous) =>
                    event.target.checked
                      ? [...previous, member.userId]
                      : previous.filter(
                          (id) => id !== member.userId
                        )
                  );
                }}
                className="h-4 w-4 accent-indigo-600"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {member.name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {member.email}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold capitalize text-slate-500">
                {member.workspaceRole}
              </span>
            </label>
          );
        })
      )}
    </div>

    <p className="mt-3 text-xs text-slate-400">
      You will automatically be added as the project owner.
      Selected members will initially have the Member role.
    </p>
  </div>
)}

              <div>

                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Project color
                </p>

                <div className="flex flex-wrap gap-3">
                  {Object.entries(projectColors).map(([color, style]) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Choose ${color} project color`}
                      aria-pressed={projectForm.color === color}
                      onClick={() =>
                        setProjectForm({ ...projectForm, color })
                      }
                      className={`h-8 w-8 rounded-full ${style.accent} ${
                        projectForm.color === color
                          ? "ring-2 ring-offset-2 ring-indigo-500"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {!editingId && (
                <p className="rounded-xl bg-indigo-50 px-3 py-2.5 text-xs leading-5 text-indigo-700">
                  You will automatically become the owner of this project.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAILS MODAL */}
      {showDetailsModal && selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !showTaskModal &&
              !deleteTaskTarget
            ) {
              setShowDetailsModal(false);
            }
          }}
        >
          <div className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${
                    (projectColors[selectedProject.color] ||
                      projectColors.indigo).icon
                  }`}
                >
                  <FolderKanban size={22} />
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={getProjectStatus(selectedProject)}
                    />

                    <PriorityBadge priority={selectedProject.priority} />

                    {getCurrentRole(selectedProject, currentUser.id) && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
                        Your role: {getCurrentRole(selectedProject, currentUser.id)}
                      </span>
                    )}
                  </div>

                  <h3 className="truncate pr-2 text-lg font-bold text-slate-900 sm:text-xl">
                    {selectedProject.name}
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                    {selectedProject.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close project"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
              {/* PROJECT METRICS */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    Total tasks
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {getTasks(selectedProject).length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    Completed
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 sm:text-2xl">
                    {getCompletedCount(selectedProject)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    Team members
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {selectedProject.members?.length || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)] xl:gap-6">
                {/* PROJECT TASKS */}
                <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Project tasks
                      </h4>
                      <p className="mt-1 text-xs text-slate-400">
                        Tasks and the people assigned to them
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                        {getTasks(selectedProject).length} tasks
                      </span>

                      {canCreateTask(selectedProject, currentUser.id) && (
                        <button
                          type="button"
                          onClick={startCreateTask}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          <Plus size={15} />
                          Create Task
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {getTasks(selectedProject).map((task) => {
                      const assignee = getMember(
                        selectedProject,
                        task.assignedTo
                      );

                      const displayStatus = getTaskStatus(task);

                      return (
                        <div
                          key={task.id}
                          className="px-4 py-4 transition hover:bg-slate-50/70 sm:px-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-slate-800">
                                {task.title}
                              </p>

                              {task.description && (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {task.description}
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    taskStatusStyles[displayStatus] ||
                                    taskStatusStyles["To do"]
                                  }`}
                                >
                                  {displayStatus}
                                </span>

                                <PriorityBadge priority={task.priority} />
                              </div>
                            </div>

                            <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400 sm:text-xs">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                              {getInitials(assignee?.name || "Unknown")}
                            </div>

                            <span className="min-w-0 truncate text-xs font-medium text-slate-600">
                              {assignee?.name || "Unknown member"}
                            </span>

                            <span className="text-xs text-slate-300">·</span>

                            <span className="text-xs text-slate-400">
                              Assignee
                            </span>

                            {/* OWNER / ADMIN TASK CONTROLS */}
                            {canManageProject(selectedProject, currentUser.id) && (
                              <div className="ml-auto flex items-center gap-2">
                                <select
                                  aria-label={`Update status for ${task.title}`}
                                  value={task.status}
                                  onChange={(event) =>
                                    updateTaskStatus(
                                      task.id,
                                      event.target.value
                                    )
                                  }
                                  className="h-8 max-w-[145px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none focus:border-indigo-400"
                                >
                                  <option>To do</option>
                                  <option>In progress</option>
                                  <option>Completed</option>
                                </select>

                                {/* DELETE TASK BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => requestDeleteTask(task)}
                                  title="Delete task"
                                  aria-label={`Delete ${task.title}`}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {getTasks(selectedProject).length === 0 && (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <CheckCircle2 size={20} />
                        </div>

                        <p className="text-sm font-semibold text-slate-700">
                          No tasks yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Create the first task to get this project moving.
                        </p>

                        {canCreateTask(selectedProject, currentUser.id) && (
                          <button
                            type="button"
                            onClick={startCreateTask}
                            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            <Plus size={14} />
                                                        Create first task
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                    <p className="text-xs text-slate-400">
                      {getTasks(selectedProject).length} tasks in this project
                    </p>
                  </div>
                </section>

                {/* PROJECT INFO + MEMBERS */}
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900">
                        Project overview
                      </h4>
                      <Target size={18} className="text-indigo-500" />
                    </div>

                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-500">
                        Progress
                      </span>
                      <span className="text-sm font-bold tabular-nums text-indigo-600">
                        {getProgress(selectedProject)}%
                      </span>
                    </div>

                    <ProgressBar
                      value={getProgress(selectedProject)}
                      color={selectedProject.color}
                    />

                    <div className="mt-5 space-y-3">
                      <DetailLine
                        icon={<BriefcaseBusiness size={16} />}
                        label="Category"
                        value={selectedProject.category}
                      />

                      <DetailLine
                        icon={<Flag size={16} />}
                        label="Priority"
                        value={selectedProject.priority}
                      />

                      <DetailLine
                        icon={<CalendarDays size={16} />}
                        label="Deadline"
                        value={formatDate(selectedProject.deadline)}
                      />

                      <DetailLine
                        icon={<Clock3 size={16} />}
                        label="Created"
                        value={formatDate(selectedProject.createdAt)}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Project members
                        </h4>
                        <p className="mt-1 text-xs text-slate-400">
                          People working on this project
                        </p>
                      </div>

                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-600">
                        {selectedProject.members?.length || 0} members
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(selectedProject.members || []).map(
                        (member, index) => {
                          const assignedCount = getTasks(
                            selectedProject
                          ).filter(
                            (task) => task.assignedTo === member.userId
                          ).length;

                          return (
                            <div
                              key={member.userId}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  [
                                    "bg-indigo-100 text-indigo-700",
                                    "bg-purple-100 text-purple-700",
                                    "bg-sky-100 text-sky-700",
                                    "bg-emerald-100 text-emerald-700",
                                  ][index % 4]
                                }`}
                              >
                                {getInitials(member.name || "Member")}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {member.name || "Team member"}
                                  {member.userId === currentUser.id
                                    ? " (You)"
                                    : ""}
                                </p>

                                <p className="text-xs capitalize text-slate-400">
                                  {member.role} · {assignedCount}{" "}
                                  {assignedCount === 1 ? "task" : "tasks"} assigned
                                </p>
                              </div>

                              {member.role === "owner" ? (
                                <Crown
                                  size={15}
                                  className="shrink-0 text-amber-500"
                                />
                              ) : member.role === "admin" ? (
                                <ShieldCheck
                                  size={15}
                                  className="shrink-0 text-indigo-500"
                                />
                              ) : (
                                <UserRound
                                  size={15}
                                  className="shrink-0 text-slate-300"
                                />
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <p className="self-center text-xs text-slate-400">
                  {canCreateTask(selectedProject, currentUser.id)
                    ? "You can create and manage tasks in this project."
                    : "You have member access. An owner or admin can create project tasks."}
                </p>

                {canManageProject(selectedProject, currentUser.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      startEditProject(selectedProject);
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Pencil size={15} />
                    Edit project
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT TASK MODAL */}
      {showTaskModal && selectedProject && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowTaskModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Plus size={20} />
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Create project task
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add a task to{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedProject.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                aria-label="Close task form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleCreateProjectTask}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="project-task-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Task title *
                </label>

                <input
                  id="project-task-title"
                  required
                  autoFocus
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="e.g. Build project settings page"
                  className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="project-task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="project-task-description"
                  rows={3}
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe what needs to be done..."
                  className="w-full resize-y rounded-xl border border-slate-200 p-3 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:text-sm"
                />
              </div>

              {/* Project is fixed: no Personal / No Project option. */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                  Project
                </p>

                <p className="mt-1 text-sm font-semibold text-indigo-900">
                  {selectedProject.name}
                </p>

                <p className="mt-1 text-xs text-indigo-600">
                  This task will be created inside this project.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="project-task-assignee"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Assign to *
                  </label>

                  <select
                    id="project-task-assignee"
                    required
                    value={taskForm.assignedTo}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        assignedTo: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select a project member
                    </option>

                    {(selectedProject.members || []).map((member) => (
                      <option
                        key={member.userId}
                        value={member.userId}
                      >
                        {member.name || "Team member"}
                        {member.userId === currentUser.id
                          ? " (You)"
                          : ""}{" "}
                        · {member.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-task-priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="project-task-priority"
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        priority: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="project-task-due-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Due date
                  </label>

                  <input
                    id="project-task-due-date"
                    type="date"
                    min={todayString()}
                    value={taskForm.dueDate}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        dueDate: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                New tasks start as{" "}
                <span className="font-semibold text-slate-700">
                  To do
                </span>
                . The creator and creation date are added automatically.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} />
                  {saving ? "Creating..." : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TASK CONFIRMATION */}
      {deleteTaskTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Delete this task?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                {deleteTaskTarget.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTaskTarget(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteTask}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PROJECT CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Delete this project?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">
                {deleteTarget.name}
              </span>{" "}
              will be permanently deleted, including all tasks belonging to it. This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[160] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl"
        >
          <CheckCircle2
            size={18}
            className="shrink-0 text-emerald-600"
          />
          {notice}
        </div>
      )}
    </main>
  );
}