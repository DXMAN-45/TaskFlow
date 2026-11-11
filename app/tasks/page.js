
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

const initialTasks = [
  {
    id: 1,
    title: "Redesign user profile",
    description: "Update the profile layout and improve the user experience.",
    project: "TaskFlow Website",
    assignee: "You",
    priority: "High",
    status: "In progress",
    dueDate: "2026-11-14",
  },
  {
    id: 2,
    title: "Create dashboard widgets",
    description: "Build responsive cards for the dashboard overview.",
    project: "TaskFlow Website",
    assignee: "Riya",
    priority: "Medium",
    status: "In progress",
    dueDate: "2026-11-16",
  },
  {
    id: 3,
    title: "Fix mobile navigation",
    description: "Improve navigation spacing and mobile responsiveness.",
    project: "Mobile Experience",
    assignee: "You",
    priority: "High",
    status: "Overdue",
    dueDate: "2026-11-09",
  },
  {
    id: 4,
    title: "Update authentication UI",
    description: "Polish the login and account creation experience.",
    project: "TaskFlow Website",
    assignee: "Alex",
    priority: "Low",
    status: "Completed",
    dueDate: "2026-11-10",
  },
  {
    id: 5,
    title: "Prepare project documentation",
    description: "Document the main project workflows and components.",
    project: "Documentation",
    assignee: "You",
    priority: "Medium",
    status: "To do",
    dueDate: "2026-11-18",
  },
  {
    id: 6,
    title: "Review invitation flow",
    description: "Test the team invitation and acceptance experience.",
    project: "Team Management",
    assignee: "Riya",
    priority: "High",
    status: "In progress",
    dueDate: "2026-11-20",
  },
];

const filters = ["All tasks", "To do", "In progress", "Completed", "Overdue"];

const priorityStyles = {
  High: "bg-rose-50 text-rose-700 ring-rose-100",
  Medium: "bg-amber-50 text-amber-700 ring-amber-100",
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusStyles = {
  "To do": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-rose-50 text-rose-700",
};

function formatDate(value) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function isOverdue(task) {
  if (task.status === "Completed" || !task.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${task.dueDate}T00:00:00`) < today;
}

function getStatus(task) {
  return isOverdue(task) ? "Overdue" : task.status;
}

function TaskPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "",
    assignee: "You",
    priority: "Medium",
    status: "To do",
    dueDate: "",
  });

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((task) => getStatus(task) === "To do").length,
      progress: tasks.filter(
        (task) => getStatus(task) === "In progress"
      ).length,
      completed: tasks.filter(
        (task) => getStatus(task) === "Completed"
      ).length,
      overdue: tasks.filter(
        (task) => getStatus(task) === "Overdue"
      ).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const status = getStatus(task);

      const matchesFilter =
        activeFilter === "All tasks" || status === activeFilter;

      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, activeFilter, search]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      project: "",
      assignee: "You",
      priority: "Medium",
      status: "To do",
      dueDate: "",
    });
    setFormError("");
  };

  const handleCreateTask = (event) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setFormError("Enter a task title.");
      return;
    }

    const newTask = {
      ...form,
      title,
      description: form.description.trim(),
      project: form.project.trim() || "General",
      id: Date.now(),
    };

    setTasks((current) => [newTask, ...current]);
    setActiveFilter("All tasks");
    setSearch("");
    setIsCreateOpen(false);
    resetForm();
  };

  const updateStatus = (taskId, nextStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )
    );
  };

  const openCreate = () => {
    setSelectedTask(null);
    resetForm();
    setIsCreateOpen(true);
  };

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-slate-100">
      <Sidebar active="tasks" />
      <Sidebarmob active="tasks" />

      <div className="ml-[76px] flex h-dvh min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="hidden items-center gap-2 text-sm text-slate-400 lg:flex">
              Workspace
              <span>/</span>
              <span className="font-semibold text-slate-800">My tasks</span>
            </div>

            <div className="min-w-0 flex-1 lg:max-w-md">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your tasks..."
                aria-label="Search tasks"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              />
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="hidden h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 sm:flex"
            >
              <span className="text-lg leading-none">+</span>
              Create task
            </button>
          </div>
        </header>

        {/* Scrollable page */}
        <div className="scrollbar-hide mx-auto flex w-full max-w-[1800px] min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden p-3 sm:gap-7 sm:p-6 lg:gap-8 lg:p-8">
          {/* Page title */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                My tasks
              </h1>
              <p className="text-sm leading-6 text-slate-500 sm:text-base">
                Create, organize, and track the work assigned to you.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg active:scale-95 sm:hidden"
            >
              <span className="text-lg leading-none">+</span>
              Create task
            </button>
          </section>

          {/* Summary */}
          <section
            aria-label="Task summary"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
          >
            {[
              { label: "Total tasks", value: counts.all, color: "text-slate-900" },
              { label: "In progress", value: counts.progress, color: "text-blue-600" },
              { label: "Completed", value: counts.completed, color: "text-emerald-600" },
              { label: "Overdue", value: counts.overdue, color: "text-rose-600" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
              >
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  {item.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold tracking-tight ${item.color}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          {/* Task list */}
          <section className="min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    All tasks
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {filteredTasks.length}{" "}
                    {filteredTasks.length === 1 ? "task" : "tasks"} found
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filter tasks by status"
              >
                {filters.map((filter) => {
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      aria-pressed={isActive}
                      className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition sm:text-sm ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table header - desktop */}
            <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(110px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)] gap-4 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
              <span>Task</span>
              <span>Project</span>
              <span>Priority</span>
              <span>Due date</span>
              <span>Status</span>
            </div>

            {/* Records */}
           <div className="h-[480px] sm:h-[420px] divide-y divide-slate-100 overflow-y-auto scrollbar-hide border border-slate-200 rounded-b-2xl">
              {filteredTasks.map((task) => {
                const status = getStatus(task);

                return (
                  <article
                    key={task.id}
                    className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-blue-50/30 sm:p-5 md:grid-cols-[minmax(0,1.7fr)_minmax(110px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)] md:items-center md:gap-4 md:px-6"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
                      aria-label={`View task: ${task.title}`}
                    >
                      <p className="truncate text-sm font-bold text-slate-800">
                        {task.title}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        {task.description || "No description"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 md:hidden">
                        Assigned to {task.assignee}
                      </p>
                    </button>

                    <div className="flex min-w-0 items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Project
                      </span>
                      <span className="truncate text-sm font-medium text-slate-600">
                        {task.project}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Priority
                      </span>
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          priorityStyles[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Due date
                      </span>
                      <span
                        className={`text-xs font-semibold sm:text-sm ${
                          status === "Overdue"
                            ? "text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Status
                      </span>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          updateStatus(task.id, event.target.value)
                        }
                        aria-label={`Change status for ${task.title}`}
                        className={`min-h-9 max-w-full rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          statusStyles[status]
                        }`}
                      >
                        <option value="To do">To do</option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </article>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <span className="text-2xl">⌕</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-800">
                    No tasks found
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    No tasks match your search. Try another keyword or clear
                    the filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveFilter("All tasks");
                    }}
                    className="mt-4 min-h-10 rounded-xl px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Create task dialog */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateOpen(false);
              setFormError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <h2
                  id="create-task-title"
                  className="text-xl font-extrabold text-slate-900"
                >
                  Create a task
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add the details and organize your work.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError("");
                }}
                aria-label="Close create task dialog"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Task title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  autoFocus
                  maxLength={120}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Design the new dashboard"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
                {formError && (
                  <p role="alert" className="mt-2 text-sm text-rose-600">
                    {formError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Add details about this task..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-project"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Project
                  </label>
                  <input
                    id="task-project"
                    type="text"
                    maxLength={100}
                    value={form.project}
                    onChange={(event) =>
                      setForm({ ...form, project: event.target.value })
                    }
                    placeholder="Project name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-assignee"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Assignee
                  </label>
                  <select
                    id="task-assignee"
                    value={form.assignee}
                    onChange={(event) =>
                      setForm({ ...form, assignee: event.target.value })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="You">You</option>
                    <option value="Riya">Riya</option>
                    <option value="Alex">Alex</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="task-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Due date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({ ...form, dueDate: event.target.value })
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="min-h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg active:scale-[0.98]"
                >
                  Create task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Task details panel */}
      {selectedTask && !isCreateOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="task-detail-title"
                  className="text-xl font-extrabold text-slate-900"
                >
                  {selectedTask.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {selectedTask.description || "No description added."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close task details"
                onClick={() => setSelectedTask(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                ["Project", selectedTask.project],
                ["Assignee", selectedTask.assignee],
                ["Priority", selectedTask.priority],
                ["Due date", formatDate(selectedTask.dueDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default TaskPage;
