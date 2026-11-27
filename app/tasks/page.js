"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";

// ==========================================
// FILTERS AND STYLES
// ==========================================

const filters = [
  "All tasks",
  "Personal",
  "To do",
  "In progress",
  "Completed",
  "Overdue",

];

const priorityStyles = {
  Urgent: "bg-rose-50 text-rose-700 ring-rose-100",
  High: "bg-orange-50 text-orange-700 ring-orange-100",
  Medium: "bg-amber-50 text-amber-700 ring-amber-100",
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusStyles = {
  "To do": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-rose-50 text-rose-700",
};

// ==========================================
// DATE HELPERS
// ==========================================

function getLocalDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function toDateOnly(value) {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// OVERDUE CALCULATION
// ==========================================

function isOverdue(task) {
  if (task.status === "Completed" || !task.dueDate) {
    return false;
  }

  return task.dueDate < getLocalDate();
}

function getStatus(task) {
  return isOverdue(task) ? "Overdue" : task.status;
}

// ==========================================
// MAIN TASK PAGE
// ==========================================

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("You");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");

  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [moveProjectId, setMoveProjectId] = useState("");
  const [isMovingTask, setIsMovingTask] = useState(false);
  const [moveError, setMoveError] = useState("");

  const [formError, setFormError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: "",
  });

  // ========================================
  // CREATE TASK FORM
  // ========================================

  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
  });

  // ========================================
  // LOAD TASKS, PROJECTS AND SESSION
  // ========================================

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [
        tasksResponse,
        projectsResponse,
        sessionResponse,
      ] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/auth/session", { cache: "no-store" }),
      ]);

      const [
        tasksData,
        projectsData,
        sessionData,
      ] = await Promise.all([
        tasksResponse.json(),
        projectsResponse.json(),
        sessionResponse.json(),
      ]);

      if (!tasksResponse.ok) {
        throw new Error(
          tasksData.message || "Unable to load tasks."
        );
      }

      if (!projectsResponse.ok) {
        throw new Error(
          projectsData.message || "Unable to load projects."
        );
      }

      const userId = sessionData?.user?.id;

      if (!userId) {
        throw new Error(
          "Your session could not be verified. Please sign in again."
        );
      }

      const userName =
        sessionData.user.name ||
        sessionData.user.email ||
        "You";

      const loadedProjects = projectsData.projects || [];

      const projectById = new Map(
        loadedProjects.map((project) => [
          String(project._id),
          project,
        ])
      );

      const normalizedTasks = (tasksData.tasks || []).map(
        (task) => {
          const project = task.projectId
            ? projectById.get(String(task.projectId))
            : null;

          const members = project?.members || [];

          const assignee = members.find(
            (member) =>
              String(member.userId) ===
              String(task.assignedTo)
          );

          const creator = members.find(
            (member) =>
              String(member.userId) ===
              String(task.createdBy)
          );

          return {
            id: String(task._id),
            title: task.title,
            description: task.description || "",

            projectId: task.projectId
              ? String(task.projectId)
              : null,

            project: project?.name || null,

            assignedToId: String(task.assignedTo || ""),

            assignedTo:
              String(task.assignedTo) === String(userId)
                ? userName
                : assignee?.name || "Project member",

            createdById: String(task.createdBy || ""),

            createdBy:
              String(task.createdBy) === String(userId)
                ? userName
                : creator?.name || "Project member",

            priority: task.priority || "Medium",
            status: task.status || "To do",
            dueDate: toDateOnly(task.dueDate),
            createdAt: toDateOnly(task.createdAt),
            overdue: Boolean(task.overdue),
          };
        }
      );

      setCurrentUserId(String(userId));
      setCurrentUserName(userName);
      setProjects(loadedProjects);
      setTasks(normalizedTasks);

      setForm((current) => ({
        ...current,
        assignedTo: current.project
          ? current.assignedTo
          : String(userId),
      }));
    } catch (error) {
      console.error("Task page loading error:", error);

      setPageError(
        error.message ||
        "Something went wrong while loading tasks."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // ========================================
  // PROJECT MEMBERS AND PERMISSIONS
  // ========================================

  const getProjectById = (projectId) =>
    projects.find(
      (project) =>
        String(project._id) === String(projectId)
    );

  const getProjectRole = (projectId) => {
    if (!projectId || !currentUserId) return null;

    const project = getProjectById(projectId);

    if (!project) return null;

    if (
      String(project.ownerId) === currentUserId
    ) {
      return "owner";
    }

    const membership = project.members?.find(
      (member) =>
        String(member.userId) === currentUserId
    );

    return membership?.role || null;
  };

  const canCreateTaskInProject = (projectId) => {
    if (!projectId) return true;

    const role = getProjectRole(projectId);

    return role === "owner" || role === "admin";
  };

  const getAvailableAssignees = (projectId) => {
    if (!projectId) {
      return currentUserId
        ? [
          {
            userId: currentUserId,
            name: currentUserName,
          },
        ]
        : [];
    }

    const project = getProjectById(projectId);

    if (!project) return [];

    const members = [...(project.members || [])];

    if (
      project.ownerId &&
      !members.some(
        (member) =>
          String(member.userId) ===
          String(project.ownerId)
      )
    ) {
      members.unshift({
        userId: project.ownerId,
        name:
          project.ownerId === currentUserId
            ? currentUserName
            : "Project owner",
        role: "owner",
      });
    }

    return members.map((member) => ({
      userId: String(member.userId),

      name:
        String(member.userId) === currentUserId
          ? currentUserName
          : member.name || "Project member",
    }));
  };

  const canDeleteTask = (task) => {
    if (!task.projectId) {
      return task.createdById === currentUserId;
    }

    const role = getProjectRole(task.projectId);

    return role === "owner" || role === "admin";
  };

  const canUpdateTask = (task) => {
    if (!task.projectId) {
      return task.createdById === currentUserId;
    }

    const role = getProjectRole(task.projectId);

    return (
      role === "owner" ||
      role === "admin" ||
      (
        role === "member" &&
        task.assignedToId === currentUserId
      )
    );
  };

  const canManageTaskDetails = (task) => {
    if (!task.projectId) {
      return task.createdById === currentUserId;
    }

    const role = getProjectRole(task.projectId);
    return role === "owner" || role === "admin";
  };

  const canReassignTask = (task) => {
    if (!task.projectId) return false;

    const role = getProjectRole(task.projectId);
    return role === "owner" || role === "admin";
  };

  // ========================================
  // TASK COUNTS
  // ========================================

  const counts = useMemo(() => {
    return {
      all: tasks.length,

      todo: tasks.filter(
        (task) => getStatus(task) === "To do"
      ).length,

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

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const status = getStatus(task);

      const matchesFilter =
        activeFilter === "Personal"
          ? task.projectId === null
          : activeFilter === "All tasks" ||
          status === activeFilter;

      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.project || "Personal")
          .toLowerCase()
          .includes(query) ||
        task.assignedTo.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, activeFilter, search]);

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      project: "",
      assignedTo: currentUserId,
      priority: "Medium",
      dueDate: "",
    });

    setFormError("");
  };

  // ========================================
  // CREATE NEW TASK
  // ========================================

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setFormError("Please enter a task title.");
      return;
    }

    if (!canCreateTaskInProject(form.project)) {
      setFormError(
        "Only project owners and admins can create project tasks."
      );
      return;
    }

    const availableAssignees =
      getAvailableAssignees(form.project);

    const validAssignee = availableAssignees.some(
      (member) => member.userId === form.assignedTo
    );

    if (form.project && !validAssignee) {
      setFormError(
        "Please select a valid project member."
      );
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: form.description.trim(),
          projectId: form.project || null,
          assignedTo: form.project
            ? form.assignedTo
            : currentUserId,
          priority: form.priority,
          dueDate: form.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create task."
        );
      }

      await loadPageData();

      setActiveFilter("All tasks");
      setSearch("");
      setIsCreateOpen(false);

      resetForm();
    } catch (error) {
      setFormError(
        error.message || "Unable to create task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // UPDATE TASK STATUS
  // ========================================

  const updateStatus = async (taskId, nextStatus) => {
    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task || !canUpdateTask(task)) return;

    const previousStatus = task.status;

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setSelectedTask((current) =>
      current?.id === taskId
        ? { ...current, status: nextStatus }
        : current
    );

    try {
      const response = await fetch(
        `/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update task."
        );
      }

      if (data.task) {
        setTasks((current) =>
          current.map((item) =>
            item.id === taskId
              ? {
                ...item,
                status: data.task.status || nextStatus,
                overdue: Boolean(data.task.overdue),
              }
              : item
          )
        );
        setSelectedTask((current) =>
          current?.id === taskId
            ? {
              ...current,
              status: data.task.status || nextStatus,
              overdue: Boolean(data.task.overdue),
            }
            : current
        );
      }
    } catch (error) {
      console.error("Task status update error:", error);

      setTasks((current) =>
        current.map((item) =>
          item.id === taskId
            ? { ...item, status: previousStatus }
            : item
        )
      );

      setSelectedTask((current) =>
        current?.id === taskId
          ? { ...current, status: previousStatus }
          : current
      );

      setPageError(
        error.message || "Unable to update task."
      );
    }
  };
  // ========================================
  // MOVE PERSONAL TASK TO PROJECT
  // ========================================

  const handleMoveTaskToProject = async () => {
    if (!selectedTask || selectedTask.projectId || !moveProjectId || isMovingTask) {
      return;
    }


    const selectedProject = projects.find(
      (project) => String(project._id) === moveProjectId
    );

    if (
      !selectedProject ||
      selectedProject.archived ||
      !canCreateTaskInProject(moveProjectId)
    ) {
      setMoveError(
        "You must be a project owner or admin to move this task."
      );
      return;
    }

    setIsMovingTask(true);
    setMoveError("");

    try {
      const response = await fetch(
        `/api/tasks/${selectedTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: moveProjectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to move task."
        );
      }

      const updatedTask = {
        ...selectedTask,
        projectId: moveProjectId,
        project: selectedProject.name,
        assignedToId: currentUserId,
        assignedTo: currentUserName,
      };

      setTasks((current) =>
        current.map((task) =>
          task.id === selectedTask.id
            ? updatedTask
            : task
        )
      );

      setSelectedTask(updatedTask);
      setMoveProjectId("");
    } catch (error) {
      setMoveError(
        error.message || "Unable to move task."
      );
    } finally {
      setIsMovingTask(false);
    }
  };


  // MOVE PROJECT TASK TO PERSONAL
  const handleMoveTaskToPersonal = async () => {
    if (!selectedTask?.projectId || isMovingTask) return;

    const role = getProjectRole(selectedTask.projectId);

    if (role !== "owner" && role !== "admin") {
      setMoveError(
        "Only project owners and admins can move tasks to Personal."
      );
      return;
    }

    setIsMovingTask(true);
    setMoveError("");

    try {
      const response = await fetch(
        `/api/tasks/${selectedTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to move task to Personal."
        );
      }

      const updatedTask = {
        ...selectedTask,
        projectId: null,
        project: null,
        assignedToId: currentUserId,
        assignedTo: currentUserName,
      };

      setTasks((current) =>
        current.map((task) =>
          task.id === selectedTask.id ? updatedTask : task
        )
      );

      setSelectedTask(updatedTask);
      setMoveProjectId("");
    } catch (error) {
      setMoveError(
        error.message || "Unable to move task."
      );
    } finally {
      setIsMovingTask(false);
    }
  };
  // ========================================
  // DELETE TASK
  // ========================================

  const handleDeleteTask = async () => {
    if (
      !taskToDelete ||
      !canDeleteTask(taskToDelete)
    ) {
      setTaskToDelete(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/tasks/${taskToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete task."
        );
      }

      setTasks((current) =>
        current.filter(
          (task) => task.id !== taskToDelete.id
        )
      );

      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }

      setTaskToDelete(null);
    } catch (error) {
      console.error("Task deletion error:", error);

      setPageError(
        error.message || "Unable to delete task."
      );

      setTaskToDelete(null);
    }
  };

  // ========================================
  // OPEN CREATE MODAL
  // ========================================

  const openCreate = () => {
    setSelectedTask(null);
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditTask = (task) => {
    if (!canManageTaskDetails(task)) return;

    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? toDateOnly(task.dueDate) || "" : "",
      assignedTo: task.assignedToId || "",
    });
    setEditError("");
    setIsEditOpen(true);
  };

  const handleEditTask = async (event) => {
    event.preventDefault();

    if (!selectedTask || !canManageTaskDetails(selectedTask) || isEditingTask) {
      return;
    }

    const title = editForm.title.trim();

    if (!title) {
      setEditError("Please enter a task title.");
      return;
    }

    if (title.length > 150) {
      setEditError("Task title cannot exceed 150 characters.");
      return;
    }

    if (editForm.description.length > 3000) {
      setEditError("Task description cannot exceed 3000 characters.");
      return;
    }

    setIsEditingTask(true);
    setEditError("");

    try {
      const payload = {
        title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      };

      if (
        selectedTask.projectId &&
        canReassignTask(selectedTask) &&
        editForm.assignedTo
      ) {
        payload.assignedTo = editForm.assignedTo;
      }

      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update task.");
      }

      const updatedTask = data.task;
      const project = updatedTask.projectId
        ? getProjectById(updatedTask.projectId)
        : null;
      const assignee = project?.members?.find(
        (member) => String(member.userId) === String(updatedTask.assignedTo)
      );

      const normalizedUpdate = {
        ...selectedTask,
        title: updatedTask.title,
        description: updatedTask.description || "",
        priority: updatedTask.priority || editForm.priority,
        dueDate: updatedTask.dueDate || null,
        assignedToId: String(updatedTask.assignedTo || selectedTask.assignedToId),
        assignedTo:
          String(updatedTask.assignedTo) === currentUserId
            ? currentUserName
            : assignee?.name || selectedTask.assignedTo,
        overdue: Boolean(updatedTask.overdue),
      };

      setTasks((current) =>
        current.map((task) =>
          task.id === selectedTask.id ? normalizedUpdate : task
        )
      );
      setSelectedTask(normalizedUpdate);
      setIsEditOpen(false);
      setEditError("");
    } catch (error) {
      setEditError(error.message || "Unable to update task.");
    } finally {
      setIsEditingTask(false);
    }
  };

  // ========================================
  // HANDLE PROJECT CHANGE
  // ========================================

  const handleProjectChange = (nextProject) => {
    const availableMembers =
      getAvailableAssignees(nextProject);

    const nextAssignee = availableMembers.some(
      (member) => member.userId === form.assignedTo
    )
      ? form.assignedTo
      : availableMembers[0]?.userId || currentUserId;

    setForm((current) => ({
      ...current,
      project: nextProject,
      assignedTo: nextAssignee,
    }));
  };

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-slate-100">
      <Sidebar active="tasks" />
      <Sidebarmob active="tasks" />

      <div className="ml-[76px] flex h-dvh min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">

        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

            <div className="hidden items-center gap-2 text-sm text-slate-400 lg:flex">
              Workspace
              <span>/</span>
              <span className="font-semibold text-slate-800">
                My tasks
              </span>
            </div>

            <div className="min-w-0 flex-1 lg:max-w-md">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
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

        {/* SCROLLABLE CONTENT */}

        <div className="scrollbar-hide mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden p-3 sm:gap-7 sm:p-6 lg:gap-8 lg:p-8">

          {/* PAGE TITLE */}

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

          {pageError && (
            <div
              className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              <span>{pageError}</span>

              <button
                type="button"
                onClick={() => setPageError("")}
                className="font-bold"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500">
              Loading your tasks...
            </div>
          )}

          {/* SUMMARY CARDS */}

          <section
            aria-label="Task summary"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
          >
            {[
              {
                label: "Total tasks",
                value: counts.all,
                color: "text-slate-900",
              },
              {
                label: "In progress",
                value: counts.progress,
                color: "text-blue-600",
              },
              {
                label: "Completed",
                value: counts.completed,
                color: "text-emerald-600",
              },
              {
                label: "Overdue",
                value: counts.overdue,
                color: "text-rose-600",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
              >
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  {item.label}
                </p>

                <p className={`mt-2 text-3xl font-extrabold tracking-tight ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          {/* TASK LIST */}

          <section className="min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {activeFilter === "Personal"
                      ? "Personal tasks"
                      : activeFilter === "All tasks"
                        ? "All tasks"
                        : `${activeFilter} tasks`}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {filteredTasks.length}{" "}
                    {filteredTasks.length === 1
                      ? "task"
                      : "tasks"}{" "}
                    found
                  </p>
                </div>
              </div>

              {/* FILTERS */}

              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filter tasks by status"
              >
                {filters.map((filter) => {
                  const isActive =
                    activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() =>
                        setActiveFilter(filter)
                      }
                      aria-pressed={isActive}
                      className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition sm:text-sm ${isActive
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

            {/* DESKTOP TABLE HEADER */}

            <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(110px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)] gap-4 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
              <span>Task</span>
              <span>Project</span>
              <span>Priority</span>
              <span>Due date</span>
              <span>Status</span>
            </div>

            {/* TASK RECORDS */}

            <div className="h-[480px] divide-y divide-slate-100 overflow-y-auto rounded-b-2xl border border-slate-200 scrollbar-hide sm:h-[420px]">

              {!isLoading && filteredTasks.map((task) => {
                const status = getStatus(task);

                return (
                  <article
                    key={task.id}
                    className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-blue-50/30 sm:p-5 md:grid-cols-[minmax(0,1.7fr)_minmax(110px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)] md:items-center md:gap-4 md:px-6"
                  >

                    {/* TASK TITLE */}

                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            task.id,
                            task.status === "Completed" ? "To do" : "Completed"
                          )
                        }
                        disabled={!canUpdateTask(task)}
                        aria-label={
                          task.status === "Completed"
                            ? `Mark ${task.title} as To do`
                            : `Mark ${task.title} as Completed`
                        }
                        title={
                          canUpdateTask(task)
                            ? "Change completion status"
                            : "You cannot update this task"
                        }
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${task.status === "Completed"
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                            : "border-slate-300 bg-white text-transparent hover:border-blue-400"
                          } ${!canUpdateTask(task) ? "cursor-not-allowed opacity-45" : "active:scale-90"}`}
                      >
                        <span aria-hidden="true">✓</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setMoveProjectId("");
                          setMoveError("");
                        }}
                        className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label={`View task: ${task.title}`}
                      >
                        <p
                          className={`truncate text-sm font-bold transition-colors ${task.status === "Completed"
                              ? "text-slate-400 line-through decoration-slate-300"
                              : "text-slate-800"
                            }`}
                        >
                          {task.title}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                          {task.description || "No description"}
                        </p>

                        <p className="mt-2 text-xs font-medium text-blue-600 md:hidden">
                          Manage task
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setMoveProjectId("");
                          setMoveError("");
                        }}
                        className="hidden min-h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:flex"
                        aria-label={`Manage task: ${task.title}`}
                      >
                        Manage
                      </button>
                    </div>

                    {/* PROJECT */}

                    <div className="flex min-w-0 items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Project
                      </span>

                      <span className="truncate text-sm font-medium text-slate-600">
                        {task.project || "Personal"}
                      </span>
                    </div>

                    {/* PRIORITY */}

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Priority
                      </span>

                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${priorityStyles[task.priority] ||
                          priorityStyles.Medium
                          }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* DUE DATE */}

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Due date
                      </span>

                      <span
                        className={`text-xs font-semibold sm:text-sm ${status === "Overdue"
                          ? "text-rose-600"
                          : "text-slate-500"
                          }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </div>


                    {/* STATUS */}

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs text-slate-400 md:hidden">
                        Status
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {canUpdateTask(task) ? (
                          <select
                            value={task.status}
                            onChange={(event) =>
                              updateStatus(
                                task.id,
                                event.target.value
                              )
                            }
                            aria-label={`Change status for ${task.title}`}
                            className={`min-h-9 max-w-full rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${statusStyles[status]
                              }`}
                          >
                            <option value="To do">
                              To do
                            </option>
                            <option value="In progress">
                              In progresss
                            </option>
                            <option value="Completed">
                              Completed
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${statusStyles[status]}`}
                            title="Only the assignee can update this task"
                          >
                            {status}
                          </span>
                        )}

                        {status === "Overdue" && (
                          <span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                  </article>
                );
              })}

              {/* EMPTY STATE */}

              {!isLoading && filteredTasks.length === 0 && (
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

      {/* ======================================
          CREATE TASK MODAL
      ====================================== */}

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateOpen(false);
              resetForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <h2
                  id="create-task-title"
                  className="text-xl font-extrabold text-slate-900"
                >
                  Create a task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add details and organize your work.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                aria-label="Close create task dialog"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ×
              </button>
            </div>

            {/* CREATE TASK FORM */}

            <form
              onSubmit={handleCreateTask}
              className="space-y-5 p-5 sm:p-7"
            >

              {/* TITLE */}

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
                  onChange={(event) => {
                    setForm({
                      ...form,
                      title: event.target.value,
                    });

                    setFormError("");
                  }}
                  placeholder="e.g. Design the new dashboard"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />

                {formError && (
                  <p
                    role="alert"
                    className="mt-2 text-sm text-rose-600"
                  >
                    {formError}
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}

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
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Add details about this task..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              {/* PROJECT AND ASSIGNEE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* PROJECT DROPDOWN */}

                <div>
                  <label
                    htmlFor="task-project"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Project
                  </label>

                  <select
                    id="task-project"
                    value={form.project}
                    onChange={(event) =>
                      handleProjectChange(event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="">
                      No Project (Personal)
                    </option>

                    {projects
                      .filter((project) => !project.archived)
                      .map((project) => {
                        const role = getProjectRole(
                          String(project._id)
                        );

                        const allowed = canCreateTaskInProject(
                          String(project._id)
                        );

                        return (
                          <option
                            key={project._id}
                            value={String(project._id)}
                            disabled={!allowed}
                          >
                            {project.name} — {(role || "member").toUpperCase()}
                            {!allowed
                              ? " (Cannot create tasks)"
                              : ""}
                          </option>
                        );
                      })}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Select a project or keep this personal.
                  </p>
                </div>

                {/* ASSIGNEE DROPDOWN */}

                <div>
                  <label
                    htmlFor="task-assignee"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Assign to
                  </label>

                  <select
                    id="task-assignee"
                    value={form.assignedTo}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assignedTo: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    {getAvailableAssignees(form.project).map(
                      (member) => (
                        <option
                          key={member.userId}
                          value={member.userId}
                        >
                          {member.userId === currentUserId
                            ? `${member.name} (Me)`
                            : member.name}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-400">
                    {form.project
                      ? "Showing selected project members."
                      : "Personal tasks are assigned to you."}
                  </p>
                </div>

                {/* PRIORITY */}

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
                      setForm({
                        ...form,
                        priority: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* DUE DATE */}

              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Due date
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      dueDate: event.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Leave empty if this task has no deadline.
                </p>
              </div>

              {/* DEFAULT STATUS INFO */}

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Initial status
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    New tasks always start as To do.
                  </p>
                </div>

                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  To do
                </span>
              </div>

              {/* FORM BUTTONS */}

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
                  disabled={isSubmitting}
                  className="min-h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Create task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ======================================
          TASK DETAILS MODAL
      ====================================== */}

      {selectedTask && !isCreateOpen && !isEditOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTask(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >

            {/* DETAILS HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Task details
                </p>

                <h2
                  id="task-detail-title"
                  className="break-words text-xl font-extrabold text-slate-900"
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

            {/* TASK INFORMATION */}

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Project", selectedTask.project || "Personal"],
                ["Assigned to", selectedTask.assignedTo],
                ["Priority", selectedTask.priority],
                ["Due date", formatDate(selectedTask.dueDate)],
                ["Created at", formatDate(selectedTask.createdAt)],
                ["Created by", selectedTask.createdBy],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-xl bg-slate-50 p-3"
                >
                  <p className="text-xs font-semibold text-slate-400">
                    {label}
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            {/* MOVE PERSONAL TASK TO PROJECT */}

            {selectedTask && !selectedTask.projectId && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Move to project
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Move this personal task into one of your projects.
                  </p>
                </div>

                {projects.filter(
                  (project) =>
                    !project.archived &&
                    canCreateTaskInProject(String(project._id))
                ).length > 0 ? (
                  <>
                    <select
                      value={moveProjectId}
                      onChange={(event) => {
                        setMoveProjectId(event.target.value);
                        setMoveError("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">Select a project</option>

                      {projects
                        .filter(
                          (project) =>
                            !project.archived &&
                            canCreateTaskInProject(String(project._id))
                        )
                        .map((project) => (
                          <option
                            key={project._id}
                            value={String(project._id)}
                          >
                            {project.name}
                          </option>
                        ))}
                    </select>

                    {moveError && (
                      <p className="mt-2 text-xs font-medium text-rose-600">
                        {moveError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleMoveTaskToProject}
                      disabled={!moveProjectId || isMovingTask}
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isMovingTask ? "Moving task..." : "Move to project"}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    You don't have any projects where you can create tasks.
                  </p>
                )}
              </div>
            )}
            {/* MOVE PROJECT TASK TO PERSONAL */}

            {selectedTask.projectId && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Move to Personal
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Remove this task from its project and keep it in your personal tasks.
                </p>

                {canCreateTaskInProject(selectedTask.projectId) ? (
                  <>
                    {moveError && (
                      <p className="mt-2 text-xs font-medium text-rose-600">
                        {moveError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleMoveTaskToPersonal}
                      disabled={isMovingTask}
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isMovingTask ? "Moving task..." : "Move to Personal"}
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Only project owners and admins can move tasks to Personal.
                  </p>
                )}
              </div>
            )}
            {/* STATUS */}

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Task status
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Update the task progress.
                  </p>
                </div>

                {canUpdateTask(selectedTask) ? (
                  <select
                    value={selectedTask.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value;

                      updateStatus(
                        selectedTask.id,
                        nextStatus
                      );
                    }}
                    className={`max-w-[150px] rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${statusStyles[getStatus(selectedTask)]
                      }`}
                  >
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <span
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${statusStyles[getStatus(selectedTask)]}`}
                  >
                    {getStatus(selectedTask)}
                  </span>
                )}
              </div>

              {isOverdue(selectedTask) && (
                <p className="mt-3 text-xs font-semibold text-rose-600">
                  This task is overdue. Its deadline has passed.
                </p>
              )}
            </div>

            {/* EDIT TASK */}

            {canManageTaskDetails(selectedTask) && (
              <button
                type="button"
                onClick={() => openEditTask(selectedTask)}
                className="mt-5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Edit task
              </button>
            )}

            {/* DELETE BUTTON */}

            {canDeleteTask(selectedTask) && (
              <button
                type="button"
                onClick={() =>
                  setTaskToDelete(selectedTask)
                }
                className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                Delete task
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="mt-3 min-h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Done
            </button>
          </section>
        </div>
      )}

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {taskToDelete && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setTaskToDelete(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <span className="text-2xl font-bold">!</span>
            </div>

            <h2
              id="delete-task-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Delete this task?
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-500">
              Are you sure you want to delete "{taskToDelete.title}"? This
              action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                className="min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Yes, delete task
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ======================================
          EDIT TASK MODAL
      ====================================== */}

      {isEditOpen && selectedTask && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isEditingTask) {
              setIsEditOpen(false);
              setEditError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <h2 id="edit-task-title" className="text-xl font-extrabold text-slate-900">
                  Edit task
                </h2>
                <p className="mt-1 text-sm text-slate-500">Update the task details.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditingTask) {
                    setIsEditOpen(false);
                    setEditError("");
                  }
                }}
                aria-label="Close edit task dialog"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-5 p-5 sm:p-7">
              <div>
                <label htmlFor="edit-task-title-input" className="mb-2 block text-sm font-semibold text-slate-700">
                  Task title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-task-title-input"
                  type="text"
                  required
                  maxLength={150}
                  autoFocus
                  value={editForm.title}
                  onChange={(event) => {
                    setEditForm((current) => ({ ...current, title: event.target.value }));
                    setEditError("");
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-task-description" className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  id="edit-task-description"
                  rows={4}
                  maxLength={3000}
                  value={editForm.description}
                  onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-task-priority" className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    id="edit-task-priority"
                    value={editForm.priority}
                    onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-task-due-date" className="mb-2 block text-sm font-semibold text-slate-700">
                    Due date <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="edit-task-due-date"
                    type="date"
                    value={editForm.dueDate}
                    onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {selectedTask.projectId && canReassignTask(selectedTask) && (
                  <div className="sm:col-span-2">
                    <label htmlFor="edit-task-assignee" className="mb-2 block text-sm font-semibold text-slate-700">
                      Assign to
                    </label>
                    <select
                      id="edit-task-assignee"
                      value={editForm.assignedTo}
                      onChange={(event) => setEditForm((current) => ({ ...current, assignedTo: event.target.value }))
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                    >
                      {getAvailableAssignees(selectedTask.projectId).map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.userId === currentUserId ? `${member.name} (Me)` : member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {editError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isEditingTask}
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditError("");
                  }}
                  className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingTask}
                  className="min-h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEditingTask ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

