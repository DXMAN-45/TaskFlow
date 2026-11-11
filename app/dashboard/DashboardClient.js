
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Circle,
  MoreHorizontal,
  X,
  ChevronDown,
  ArrowUpRight,
  ListTodo,
  Users,
  FolderKanban,
  TrendingUp,
  Check,
  Filter,
  Calendar,
  UserRound,
  Flag,
  FileText,
  Settings,
  Activity,
} from "lucide-react";

import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

const initialTasks = [
  {
    id: 1,
    title: "Redesign user profile",
    description:
      "Improve the user profile experience with a cleaner layout and better accessibility.",
    project: "TaskFlow Website",
    assignee: "You",
    priority: "High",
    status: "In progress",
    dueDate: "2026-11-14",
  },
  {
    id: 2,
    title: "Create dashboard widgets",
    description:
      "Build reusable dashboard widgets for project progress and team statistics.",
    project: "TaskFlow Website",
    assignee: "Riya",
    priority: "Medium",
    status: "In progress",
    dueDate: "2026-11-16",
  },
  {
    id: 3,
    title: "Fix mobile navigation",
    description:
      "Resolve mobile navigation issues and improve the responsive sidebar.",
    project: "Mobile Experience",
    assignee: "You",
    priority: "High",
    status: "Overdue",
    dueDate: "2026-11-09",
  },
  {
    id: 4,
    title: "Update authentication UI",
    description:
      "Polish the login and registration screens.",
    project: "TaskFlow Website",
    assignee: "Alex",
    priority: "Low",
    status: "Completed",
    dueDate: "2026-11-10",
  },
  {
    id: 5,
    title: "Prepare project documentation",
    description:
      "Document the project structure, features, and setup instructions.",
    project: "Documentation",
    assignee: "You",
    priority: "Medium",
    status: "To do",
    dueDate: "2026-11-18",
  },
  {
    id: 6,
    title: "Review invitation flow",
    description:
      "Test the invitation process and improve error handling.",
    project: "Team Management",
    assignee: "Riya",
    priority: "High",
    status: "In progress",
    dueDate: "2026-11-20",
  },
];

const initialActivities = [
  {
    id: 1,
    name: "Riya Sharma",
    action: "completed a task",
    target: "Update authentication UI",
    time: "10 minutes ago",
    color: "bg-purple-100 text-purple-700",
    initials: "RS",
  },
  {
    id: 2,
    name: "Alex Morgan",
    action: "created a new task",
    target: "Review invitation flow",
    time: "1 hour ago",
    color: "bg-blue-100 text-blue-700",
    initials: "AM",
  },
  {
    id: 3,
    name: "You",
    action: "updated a task",
    target: "Redesign user profile",
    time: "Yesterday",
    color: "bg-emerald-100 text-emerald-700",
    initials: "YO",
  },
];

const filters = ["All Tasks", "In progress", "To do", "Completed", "Overdue"];

function formatDate(dateString) {
  if (!dateString) return "No date";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }) {
  const styles = {
    "In progress": "bg-blue-50 text-blue-700 border-blue-100",
    "To do": "bg-slate-100 text-slate-600 border-slate-200",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Overdue: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles["To do"]
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    High: "text-red-600 bg-red-50",
    Medium: "text-amber-700 bg-amber-50",
    Low: "text-emerald-700 bg-emerald-50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[priority] || styles.Medium
      }`}
    >
      <Flag size={12} />
      {priority}
    </span>
  );
}

function Avatar({ name, image, size = "normal" }) {
  const dimensions =
    size === "small"
      ? "h-7 w-7 text-[10px]"
      : "h-9 w-9 text-xs";

  if (image) {
    return (
      <img
        src={image}
        alt={name || "User"}
        className={`${dimensions} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function DashboardClient({ user = {} }) {
  const userName = user?.name || "there";
  const userImage = user?.image || null;

  const [tasks, setTasks] = useState(initialTasks);
  const [activities, setActivities] = useState(initialActivities);

  const [activeFilter, setActiveFilter] = useState("All Tasks");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project: "TaskFlow Website",
    assignee: "You",
    priority: "Medium",
    status: "To do",
    dueDate: "",
  });

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (activeFilter !== "All Tasks") {
      result = result.filter((task) => task.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter((task) =>
        [
          task.title,
          task.description,
          task.project,
          task.assignee,
          task.priority,
          task.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [tasks, activeFilter, searchQuery]);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In progress"
  ).length;

  const overdueTasks = tasks.filter(
    (task) => task.status === "Overdue"
  ).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const upcomingTasks = [...tasks]
    .filter(
      (task) =>
        task.status !== "Completed" &&
        task.status !== "Overdue"
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const addActivity = (action, target) => {
    const activity = {
      id: Date.now(),
      name: userName,
      action,
      target,
      time: "Just now",
      color: "bg-indigo-100 text-indigo-700",
      initials: getInitials(userName),
    };

    setActivities((previous) => [
      activity,
      ...previous,
    ].slice(0, 8));
  };

  const handleCreateTask = (event) => {
    event.preventDefault();

    if (!newTask.title.trim()) return;

    const task = {
      ...newTask,
      id: Date.now(),
    };

    setTasks((previous) => [task, ...previous]);

    addActivity("created a new task", task.title);

    setNewTask({
      title: "",
      description: "",
      project: "TaskFlow Website",
      assignee: "You",
      priority: "Medium",
      status: "To do",
      dueDate: "",
    });

    setShowCreateModal(false);
  };

  const toggleTaskStatus = (taskId) => {
    const currentTask = tasks.find(
      (task) => task.id === taskId
    );

    if (!currentTask) return;

    const nextStatus =
      currentTask.status === "Completed"
        ? "To do"
        : "Completed";

    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? { ...task, status: nextStatus }
          : task
      )
    );

    addActivity(
      nextStatus === "Completed"
        ? "completed a task"
        : "reopened a task",
      currentTask.title
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...currentTask,
        status: nextStatus,
      });
    }
  };

  const updateTaskStatus = (taskId, status) => {
    const currentTask = tasks.find(
      (task) => task.id === taskId
    );

    if (!currentTask) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? { ...task, status }
          : task
      )
    );

    setSelectedTask((previous) =>
      previous?.id === taskId
        ? { ...previous, status }
        : previous
    );

    addActivity("updated a task", currentTask.title);
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#f7f8fc] text-slate-800">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar active="overview" />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebarmob active="overview" />
      </div>

      {/* Main content */}
      <section className="ml-[76px] flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="z-20 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7 lg:px-9">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Workspace / Dashboard
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Overview
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="h-10 w-48 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white lg:w-64"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowNotifications((previous) => !previous)
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      Notifications
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 rounded-xl bg-indigo-50 p-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Welcome to TaskFlow
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Your workspace is ready.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Upcoming deadlines
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          You have {upcomingTasks.length} upcoming tasks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2">
              <Avatar
                name={userName}
                image={userImage}
              />
              <div className="hidden sm:block">
                <p className="max-w-28 truncate text-sm font-bold text-slate-800">
                  {userName}
                </p>
                <p className="text-xs text-slate-400">
                  Workspace member
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile search */}
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Scrollable dashboard */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-[1500px]">
            {/* Welcome section */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome, {userName} 👋
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Here&apos;s what&apos;s happening with your projects today.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                <Plus size={18} />
                New Task
              </button>
            </div>

            {/* Statistics */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Tasks"
                value={totalTasks}
                subtitle="Tasks in your workspace"
                icon={<ListTodo size={21} />}
                iconStyle="bg-indigo-50 text-indigo-600"
                trend="All tasks"
              />

              <StatCard
                title="In Progress"
                value={inProgressTasks}
                subtitle="Currently being worked on"
                icon={<Clock3 size={21} />}
                iconStyle="bg-blue-50 text-blue-600"
                trend="Active"
              />

              <StatCard
                title="Completed"
                value={completedTasks}
                subtitle="Successfully completed"
                icon={<CheckCircle2 size={21} />}
                iconStyle="bg-emerald-50 text-emerald-600"
                trend={`${completionPercentage}% complete`}
              />

              <StatCard
                title="Overdue Tasks"
                value={overdueTasks}
                subtitle="Need your attention"
                icon={<AlertCircle size={21} />}
                iconStyle="bg-red-50 text-red-600"
                trend={overdueTasks > 0 ? "Needs attention" : "All clear"}
              />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Tasks section */}
              <div className="min-w-0 xl:col-span-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        My Tasks
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Manage and track your tasks
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Filter size={14} />
                        Filter
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveFilter("All Tasks")}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Task filters */}
                  <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          activeFilter === filter
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {filter}
                        {filter === "All Tasks" && (
                          <span className="ml-1.5 opacity-70">
                            {totalTasks}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Task list */}
                  <div className="max-h-[470px] overflow-y-auto scrollbar-hide">
                    {filteredTasks.length === 0 ? (
                      <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <ListTodo size={25} />
                        </div>
                        <h4 className="font-bold text-slate-700">
                          No tasks found
                        </h4>
                        <p className="mt-1 text-sm text-slate-400">
                          Try changing your search or filter.
                        </p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-start gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50/80 last:border-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              task.status === "Completed"
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 text-transparent hover:border-indigo-500"
                            }`}
                            aria-label={`Toggle ${task.title}`}
                          >
                            <Check size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openTask(task)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  task.status === "Completed"
                                    ? "text-slate-400 line-through"
                                    : "text-slate-800"
                                }`}
                              >
                                {task.title}
                              </p>
                            </div>

                            <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                              {task.project}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <StatusBadge status={task.status} />
                              <PriorityBadge priority={task.priority} />
                            </div>
                          </button>

                          <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <CalendarDays size={13} />
                              {formatDate(task.dueDate)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Avatar
                                name={task.assignee}
                                size="small"
                              />
                              {task.assignee}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openTask(task)}
                            className="rounded-lg p-2 text-slate-300 opacity-100 transition hover:bg-slate-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Task options"
                          >
                            <MoreHorizontal size={19} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                    <p className="text-xs text-slate-400">
                      Showing {filteredTasks.length} of {totalTasks} tasks
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("All Tasks")}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View all
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Activity */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Your Activity
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Recent activity in your workspace
                      </p>
                    </div>
                    <Activity size={19} className="text-slate-400" />
                  </div>

                  <div className="space-y-5">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${activity.color}`}
                        >
                          {activity.initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold">
                              {activity.name}
                            </span>{" "}
                            {activity.action}
                          </p>
                          <p className="mt-0.5 truncate text-sm font-medium text-indigo-600">
                            {activity.target}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Progress card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Task Progress
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Overall completion
                      </p>
                    </div>
                    <TrendingUp
                      size={19}
                      className="text-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-center py-3">
                    <div
                      className="relative flex h-40 w-40 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(#4f46e5 ${
                          completionPercentage * 3.6
                        }deg, #eef0f6 0deg)`,
                      }}
                    >
                      <div className="flex h-[126px] w-[126px] flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {completionPercentage}%
                        </span>
                        <span className="mt-1 text-xs text-slate-400">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <ProgressLegend
                      label="Completed"
                      value={completedTasks}
                      total={totalTasks}
                      color="bg-emerald-500"
                    />
                    <ProgressLegend
                      label="In Progress"
                      value={inProgressTasks}
                      total={totalTasks}
                      color="bg-blue-500"
                    />
                    <ProgressLegend
                      label="Overdue"
                      value={overdueTasks}
                      total={totalTasks}
                      color="bg-red-500"
                    />
                  </div>
                </div>

                {/* Upcoming deadlines */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Upcoming Deadlines
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Tasks that need your attention
                      </p>
                    </div>
                    <CalendarDays
                      size={19}
                      className="text-indigo-500"
                    />
                  </div>

                  {upcomingTasks.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                      No upcoming deadlines.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => openTask(task)}
                          className="flex w-full items-start gap-3 text-left"
                        >
                          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Calendar size={15} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(task.dueDate)}
                            </p>
                          </div>

                          <ArrowUpRight
                            size={15}
                            className="mt-1 shrink-0 text-slate-300"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team activity */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Team Activity
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Your team&apos;s recent updates
                      </p>
                    </div>
                    <Users size={19} className="text-indigo-500" />
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        name: "Riya Sharma",
                        role: "Team member",
                        initials: "RS",
                        color: "bg-purple-100 text-purple-700",
                      },
                      {
                        name: "Alex Morgan",
                        role: "Team member",
                        initials: "AM",
                        color: "bg-blue-100 text-blue-700",
                      },
                      {
                        name: userName,
                        role: "You",
                        initials: getInitials(userName),
                        color: "bg-emerald-100 text-emerald-700",
                        image: userImage,
                      },
                    ].map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center gap-3"
                      >
                        {member.image ? (
                          <Avatar
                            name={member.name}
                            image={member.image}
                          />
                        ) : (
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${member.color}`}
                          >
                            {member.initials}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {member.role}
                          </p>
                        </div>

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    onClick={() => {
                      window.location.href = "/team";
                    }}
                  >
                    <Users size={15} />
                    View Team
                  </button>
                </div>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-slate-400">
              TaskFlow © 2026. Stay organized and get things done.
            </footer>
          </div>
        </div>
      </section>

      {/* Create task modal */}
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Create New Task
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Add a task to your workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task title *
                </label>
                <input
                  required
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      title: event.target.value,
                    })
                  }
                  placeholder="e.g. Design landing page"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe what needs to be done..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Project
                  </label>
                  <select
                    value={newTask.project}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        project: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>TaskFlow Website</option>
                    <option>Mobile Experience</option>
                    <option>Documentation</option>
                    <option>Team Management</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assignee
                  </label>
                  <select
                    value={newTask.assignee}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        assignee: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>You</option>
                    <option>Riya</option>
                    <option>Alex</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        priority: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        status: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>To do</option>
                    <option>In progress</option>
                    <option>Completed</option>
                    <option>Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      dueDate: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                />
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task details modal */}
      {showTaskModal && selectedTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowTaskModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Task details
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedTask.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close task details"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-6 text-sm leading-6 text-slate-500">
              {selectedTask.description || "No description provided."}
            </p>

            <div className="space-y-4 rounded-xl bg-slate-50 p-4">
              <DetailRow
                icon={<FolderKanban size={17} />}
                label="Project"
                value={selectedTask.project}
              />

              <DetailRow
                icon={<UserRound size={17} />}
                label="Assignee"
                value={selectedTask.assignee}
              />

              <DetailRow
                icon={<Flag size={17} />}
                label="Priority"
                value={selectedTask.priority}
              />

              <DetailRow
                icon={<CalendarDays size={17} />}
                label="Due date"
                value={formatDate(selectedTask.dueDate)}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Circle size={17} />
                  Status
                </div>

                <select
                  value={selectedTask.status}
                  onChange={(event) =>
                    updateTaskStatus(
                      selectedTask.id,
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                >
                  <option>To do</option>
                  <option>In progress</option>
                  <option>Completed</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  toggleTaskStatus(selectedTask.id);
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <CheckCircle2 size={17} />
                {selectedTask.status === "Completed"
                  ? "Reopen task"
                  : "Mark completed"}
              </button>

              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* Statistics card */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
  trend,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          {subtitle}
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-indigo-600">
          {trend}
        </span>
      </div>
    </div>
  );
}

/* Progress legend */
function ProgressLegend({ label, value, total, color }) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <span className="text-xs font-medium text-slate-600">
            {label}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-700">
          {value}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* Task detail row */
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
