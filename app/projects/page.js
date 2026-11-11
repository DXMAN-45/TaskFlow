
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  FolderKanban,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CalendarDays,
  Users,
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
  CircleDot,
  Flag,
  Activity,
  Trash2,
  Pencil,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

const initialProjects = [
  {
    id: 1,
    name: "TaskFlow Website",
    description:
      "Building a clean and intuitive task management experience for teams.",
    category: "Product Development",
    status: "In progress",
    priority: "High",
    progress: 72,
    tasks: 18,
    completed: 13,
    members: ["MS", "RS", "AM"],
    memberNames: ["Mandeep Singh", "Riya Sharma", "Alex Morgan"],
    owner: "Mandeep Singh",
    color: "indigo",
    deadline: "2026-11-28",
    createdAt: "2026-09-12",
  },
  {
    id: 2,
    name: "Mobile Experience",
    description:
      "Improving navigation, responsive layouts, and the mobile experience.",
    category: "Design & UX",
    status: "In progress",
    priority: "High",
    progress: 48,
    tasks: 12,
    completed: 6,
    members: ["MS", "AM"],
    memberNames: ["Mandeep Singh", "Alex Morgan"],
    owner: "Mandeep Singh",
    color: "violet",
    deadline: "2026-12-05",
    createdAt: "2026-10-01",
  },
  {
    id: 3,
    name: "Team Management",
    description:
      "Creating a better way to manage members, invitations, and permissions.",
    category: "Operations",
    status: "Planning",
    priority: "Medium",
    progress: 18,
    tasks: 11,
    completed: 2,
    members: ["MS", "RS"],
    memberNames: ["Mandeep Singh", "Riya Sharma"],
    owner: "Riya Sharma",
    color: "sky",
    deadline: "2026-12-15",
    createdAt: "2026-10-18",
  },
  {
    id: 4,
    name: "Documentation Hub",
    description:
      "Organizing product documentation, setup guides, and team resources.",
    category: "Documentation",
    status: "In progress",
    priority: "Low",
    progress: 85,
    tasks: 7,
    completed: 6,
    members: ["MS", "SW"],
    memberNames: ["Mandeep Singh", "Sophia Williams"],
    owner: "Mandeep Singh",
    color: "emerald",
    deadline: "2026-11-22",
    createdAt: "2026-09-20",
  },
  {
    id: 5,
    name: "Marketing Campaign",
    description:
      "Planning product launch content and preparing promotional material.",
    category: "Marketing",
    status: "Completed",
    priority: "Medium",
    progress: 100,
    tasks: 9,
    completed: 9,
    members: ["RS", "SW", "DC"],
    memberNames: ["Riya Sharma", "Sophia Williams", "Daniel Cooper"],
    owner: "Riya Sharma",
    color: "rose",
    deadline: "2026-10-30",
    createdAt: "2026-09-01",
  },
  {
    id: 6,
    name: "API Integration",
    description:
      "Connecting backend services and preparing stable API integrations.",
    category: "Development",
    status: "On hold",
    priority: "High",
    progress: 35,
    tasks: 14,
    completed: 5,
    members: ["MS", "AM", "DC"],
    memberNames: ["Mandeep Singh", "Alex Morgan", "Daniel Cooper"],
    owner: "Mandeep Singh",
    color: "amber",
    deadline: "2026-12-20",
    createdAt: "2026-10-05",
  },
];

const projectColors = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600",
    bar: "bg-indigo-600",
    accent: "bg-indigo-500",
    soft: "bg-indigo-50",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    bar: "bg-violet-600",
    accent: "bg-violet-500",
    soft: "bg-violet-50",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600",
    bar: "bg-sky-600",
    accent: "bg-sky-500",
    soft: "bg-sky-50",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-600",
    accent: "bg-emerald-500",
    soft: "bg-emerald-50",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    bar: "bg-rose-600",
    accent: "bg-rose-500",
    soft: "bg-rose-50",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    bar: "bg-amber-600",
    accent: "bg-amber-500",
    soft: "bg-amber-50",
  },
};

const statusStyles = {
  "In progress": "bg-blue-50 text-blue-700",
  Planning: "bg-violet-50 text-violet-700",
  Completed: "bg-emerald-50 text-emerald-700",
  "On hold": "bg-amber-50 text-amber-700",
  Archived: "bg-slate-100 text-slate-600",
};

const priorities = {
  High: "text-red-600 bg-red-50",
  Medium: "text-amber-700 bg-amber-50",
  Low: "text-emerald-700 bg-emerald-50",
};

const filters = [
  "All projects",
  "In progress",
  "Planning",
  "Completed",
  "On hold",
];

const defaultForm = {
  name: "",
  description: "",
  category: "Product Development",
  status: "Planning",
  priority: "Medium",
  deadline: "",
  owner: "Mandeep Singh",
  color: "indigo",
};

function formatDate(date) {
  if (!date) return "No deadline";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(date) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${date}T00:00:00`);
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] || statusStyles.Planning
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
        priorities[priority] || priorities.Medium
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
      {members.slice(0, max).map((initials, index) => (
        <div
          key={`${initials}-${index}`}
          title={initials}
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
          {initials}
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
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
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

function ProjectCard({ project, onOpen, onMenu, menuOpen, onEdit, onArchive, onDelete }) {
  const colors = projectColors[project.color] || projectColors.indigo;
  const remaining = getDaysRemaining(project.deadline);

  return (
    <article className="group relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}
        >
          <FolderKanban size={22} />
        </div>

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
                {project.status === "Archived" ? "Restore project" : "Archive project"}
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete project
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(project)}
        className="text-left"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="text-xs text-slate-400">{project.category}</span>
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
            {project.progress}%
          </span>
        </div>
        <ProgressBar value={project.progress} color={project.color} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs text-slate-400">Tasks completed</p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {project.completed}
            <span className="ml-1 font-medium text-slate-400">
              / {project.tasks}
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
        <div className="flex min-w-0 items-center gap-2">
          <ProjectAvatars members={project.members} />
        </div>

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
  const [projects, setProjects] = useState(initialProjects);
  const [activeFilter, setActiveFilter] = useState("All projects");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [viewMode, setViewMode] = useState("grid");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalProjects = projects.filter(
    (project) => project.status !== "Archived"
  ).length;

  const activeProjects = projects.filter(
    (project) => project.status === "In progress"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const totalTasks = projects.reduce(
    (sum, project) => sum + project.tasks,
    0
  );

  const completedTasks = projects.reduce(
    (sum, project) => sum + project.completed,
    0
  );

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (activeFilter === "All projects") {
      result = result.filter((project) => project.status !== "Archived");
    } else {
      result = result.filter((project) => project.status === activeFilter);
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
          project.owner,
          project.status,
          project.priority,
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

  const startCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowCreateModal(true);
    setOpenMenu(null);
  };

  const startEdit = (project) => {
    setForm({
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      priority: project.priority,
      deadline: project.deadline || "",
      owner: project.owner,
      color: project.color,
    });
    setEditingId(project.id);
    setShowCreateModal(true);
    setOpenMenu(null);
  };

  const handleSaveProject = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) return;

    if (editingId) {
      setProjects((previous) =>
        previous.map((project) =>
          project.id === editingId
            ? { ...project, ...form, name }
            : project
        )
      );

      setSelectedProject((previous) =>
        previous?.id === editingId
          ? { ...previous, ...form, name }
          : previous
      );

      notify("Project updated in demo data.");
    } else {
      const newProject = {
        ...form,
        id: Date.now(),
        name,
        progress: 0,
        tasks: 0,
        completed: 0,
        members: ["MS"],
        memberNames: ["Mandeep Singh"],
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setProjects((previous) => [newProject, ...previous]);
      notify("New project created.");
    }

    setShowCreateModal(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const openProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
    setOpenMenu(null);
  };

  const toggleArchive = (project) => {
    const nextStatus =
      project.status === "Archived" ? "Planning" : "Archived";

    setProjects((previous) =>
      previous.map((item) =>
        item.id === project.id ? { ...item, status: nextStatus } : item
      )
    );

    setSelectedProject((previous) =>
      previous?.id === project.id
        ? { ...previous, status: nextStatus }
        : previous
    );

    setOpenMenu(null);
    notify(
      nextStatus === "Archived"
        ? "Project archived."
        : "Project restored."
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setProjects((previous) =>
      previous.filter((project) => project.id !== deleteTarget.id)
    );

    if (selectedProject?.id === deleteTarget.id) {
      setShowDetailsModal(false);
      setSelectedProject(null);
    }

    setDeleteTarget(null);
    setOpenMenu(null);
    notify("Project deleted from demo data.");
  };

  const setProjectProgress = (project, progress) => {
    const nextProgress = Math.max(0, Math.min(100, Number(progress) || 0));

    setProjects((previous) =>
      previous.map((item) =>
        item.id === project.id
          ? {
              ...item,
              progress: nextProgress,
              completed: Math.round((item.tasks * nextProgress) / 100),
              status:
                nextProgress === 100
                  ? "Completed"
                  : nextProgress === 0
                  ? "Planning"
                  : "In progress",
            }
          : item
      )
    );

    setSelectedProject((previous) =>
      previous?.id === project.id
        ? {
            ...previous,
            progress: nextProgress,
            completed: Math.round((previous.tasks * nextProgress) / 100),
            status:
              nextProgress === 100
                ? "Completed"
                : nextProgress === 0
                ? "Planning"
                : "In progress",
          }
        : previous
    );

    notify("Project progress updated.");
  };

  return (
    <main
      className="flex h-dvh w-full overflow-hidden bg-[#f7f8fc] text-slate-800"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar active="projects" />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebarmob active="projects" />
      </div>

      {/* Content starts after the fixed mobile rail */}
      <section className="ml-[76px] flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Header */}
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
            onClick={startCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:px-4"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New project</span>
            <span className="sm:hidden">Create</span>
          </button>
        </header>

        {/* Page body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-[1500px]">
            {/* Heading */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Your work, in one place.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Bring your projects into one clear view. Track progress, see
                  who&apos;s involved, and keep the next steps visible.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Workspace overview
              </div>
            </div>

            {/* Summary */}
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
                detail="Across all listed projects"
                icon={<Target size={21} />}
                iconClass="bg-violet-50 text-violet-600"
              />
            </div>

            {/* Project progress overview */}
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
                  {[
                    {
                      label: "In progress",
                      count: projects.filter(
                        (p) => p.status === "In progress"
                      ).length,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Planning",
                      count: projects.filter(
                        (p) => p.status === "Planning"
                      ).length,
                      color: "bg-violet-500",
                    },
                    {
                      label: "Completed",
                      count: projects.filter(
                        (p) => p.status === "Completed"
                      ).length,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "On hold",
                      count: projects.filter(
                        (p) => p.status === "On hold"
                      ).length,
                      color: "bg-amber-500",
                    },
                  ].map((item) => (
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

            {/* Project list */}
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

              {/* Status filters */}
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
                {filters.map((filter) => {
                  const count =
                    filter === "All projects"
                      ? projects.filter((p) => p.status !== "Archived").length
                      : projects.filter((p) => p.status === filter).length;

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

              {/* Projects */}
              <div className="p-4 sm:p-5">
                {filteredProjects.length === 0 ? (
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
                        onEdit={startEdit}
                        onArchive={toggleArchive}
                        onDelete={setDeleteTarget}
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
                            <StatusBadge status={project.status} />
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {project.description}
                          </p>
                        </button>

                        <div className="w-full sm:w-36">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Progress</span>
                            <span className="font-bold text-slate-700">
                              {project.progress}%
                            </span>
                          </div>
                          <ProgressBar
                            value={project.progress}
                            color={project.color}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:w-40 sm:justify-end">
                          <ProjectAvatars members={project.members} />
                          <span className="text-xs text-slate-400">
                            {project.completed}/{project.tasks} tasks
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
                  Demo workspace
                </span>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-slate-400">
              TaskFlow © 2026. Keep every project moving.
            </footer>
          </div>
        </div>
      </section>

      {/* Create / edit project modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false);
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
                onClick={() => setShowCreateModal(false)}
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
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
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
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
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
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
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
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="project-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  >
                    <option>Planning</option>
                    <option>In progress</option>
                    <option>Completed</option>
                    <option>On hold</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-deadline"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Deadline
                  </label>
                  <input
                    id="project-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(event) =>
                      setForm({ ...form, deadline: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

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
                      aria-pressed={form.color === color}
                      onClick={() => setForm({ ...form, color })}
                      className={`h-8 w-8 rounded-full ${style.accent} ${
                        form.color === color
                          ? "ring-2 ring-offset-2 ring-indigo-500"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {editingId ? "Save changes" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project details modal */}
      {showDetailsModal && selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative border-b border-slate-100 bg-slate-50 px-5 py-6 sm:px-7">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close project details"
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
              >
                <X size={19} />
              </button>

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                  (projectColors[selectedProject.color] ||
                    projectColors.indigo).icon
                }`}
              >
                <FolderKanban size={22} />
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedProject.status} />
                <PriorityBadge priority={selectedProject.priority} />
              </div>

              <h3 className="pr-8 text-xl font-bold text-slate-900">
                {selectedProject.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedProject.description}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <DetailMetric
                  label="Progress"
                  value={`${selectedProject.progress}%`}
                />
                <DetailMetric
                  label="Tasks completed"
                  value={`${selectedProject.completed}/${selectedProject.tasks}`}
                />
                <DetailMetric
                  label="Team members"
                  value={selectedProject.members.length}
                />
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Project progress
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {selectedProject.progress}%
                  </span>
                </div>
                <ProgressBar
                  value={selectedProject.progress}
                  color={selectedProject.color}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Adjust the progress here for this demo project.
                </p>
                <input
                  aria-label="Project progress"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedProject.progress}
                  onChange={(event) =>
                    setProjectProgress(selectedProject, event.target.value)
                  }
                  className="mt-3 w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                <DetailLine
                  icon={<BriefcaseBusiness size={16} />}
                  label="Category"
                  value={selectedProject.category}
                />
                <DetailLine
                  icon={<Crown size={16} />}
                  label="Project owner"
                  value={selectedProject.owner}
                />
                <DetailLine
                  icon={<CalendarDays size={16} />}
                  label="Deadline"
                  value={formatDate(selectedProject.deadline)}
                />
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Project team
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedProject.memberNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    startEdit(selectedProject);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={15} />
                  Edit project
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
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
              will be removed from this demo workspace. This action cannot be
              undone.
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

      {/* Toast */}
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

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-slate-900">{value}</p>
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
