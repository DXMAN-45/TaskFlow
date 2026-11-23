import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../lib/mongodb";
import { getCurrentUser } from "../../../lib/auth";
import { ensureDefaultWorkspace } from "../../../lib/workspace";

import {
  isValidObjectId,
  getProjectRole,
  canCreateProjectTask,
} from "../../../lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

// ============================================
// VALIDATION
// ============================================

function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid request body.";
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    return "Task title is required.";
  }

  if (body.title.trim().length > 150) {
    return "Task title cannot exceed 150 characters.";
  }

  if (
    body.description !== undefined &&
    (typeof body.description !== "string" ||
      body.description.length > 3000)
  ) {
    return "Invalid task description.";
  }

  if (
    body.priority !== undefined &&
    !allowedPriorities.includes(body.priority)
  ) {
    return "Invalid task priority.";
  }

  if (
    body.dueDate !== undefined &&
    body.dueDate !== null &&
    body.dueDate !== ""
  ) {
    if (
      typeof body.dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)
    ) {
      return "Due date must use YYYY-MM-DD format.";
    }

    const date = new Date(`${body.dueDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== body.dueDate
    ) {
      return "Invalid due date.";
    }
  }

  return null;
}

// ============================================
// ACTIVE WORKSPACE
// ============================================

async function getActiveWorkspace(db, user) {
  // Ensure the user has a default workspace.
  await ensureDefaultWorkspace(db, user.id);

  // Fetch the latest user document.
  const userDocument = await db.collection("users").findOne({
    _id: new ObjectId(user.id),
  });

  if (!userDocument?.activeWorkspaceId) {
    return null;
  }

  const workspaceId = userDocument.activeWorkspaceId;

  if (!ObjectId.isValid(workspaceId)) {
    return null;
  }

  const workspaceObjectId = new ObjectId(workspaceId);

  // Verify workspace membership.
  const membership = await db.collection("workspaceMembers").findOne({
    workspaceId: workspaceObjectId,
    userId: new ObjectId(user.id),
  });

  if (!membership) {
    return null;
  }

  // Confirm workspace exists.
  const workspace = await db.collection("workspaces").findOne({
    _id: workspaceObjectId,
  });

  if (!workspace) {
    return null;
  }

  return {
    workspace,
    membership,
  };
}

// ============================================
// GET: Fetch personal and active workspace tasks
// ============================================

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const userId = new ObjectId(user.id);

    // Resolve the active workspace.
    const activeWorkspace = await getActiveWorkspace(db, user);

    if (!activeWorkspace) {
      return NextResponse.json(
        { message: "Workspace not found or access denied." },
        { status: 403 }
      );
    }

    const workspaceId = activeWorkspace.workspace._id;

    // Find projects belonging to the active workspace
    // that the current user can access.
    const projects = await db
      .collection("projects")
      .find({
        workspaceId,

        $or: [
          { ownerId: userId },
          { "members.userId": userId },
        ],
      })
      .project({ _id: 1 })
      .toArray();

    const projectIds = projects.map((project) => project._id);

    // Fetch:
    // 1. Personal tasks created by the current user.
    // 2. Tasks belonging to accessible projects
    //    in the active workspace.
    const tasks = await db
      .collection("tasks")
      .find({
        $or: [
          {
            createdBy: userId,
            projectId: null,
          },
          {
            projectId: {
              $in: projectIds,
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate overdue status dynamically.
    const today = new Date().toISOString().slice(0, 10);

    const formattedTasks = tasks.map((task) => {
      const dueDate = task.dueDate || null;

      const isOverdue =
        dueDate &&
        dueDate < today &&
        task.status !== "Completed";

      return {
        ...task,
        overdue: Boolean(isOverdue),
      };
    });

    return NextResponse.json(
      {
        tasks: formattedTasks,
        workspaceId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/tasks error:", error);

    return NextResponse.json(
      { message: "Unable to fetch tasks." },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Create personal or project task
// ============================================

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validationError = validateTask(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const userId = new ObjectId(user.id);
    const now = new Date();

    // Resolve the active workspace.
    const activeWorkspace = await getActiveWorkspace(db, user);

    if (!activeWorkspace) {
      return NextResponse.json(
        { message: "Workspace not found or access denied." },
        { status: 403 }
      );
    }

    const workspaceId = activeWorkspace.workspace._id;

    let projectId = null;
    let assignedTo = userId;

    // ========================================
    // PERSONAL TASK
    // ========================================

    if (
      body.projectId === undefined ||
      body.projectId === null ||
      body.projectId === ""
    ) {
      projectId = null;
      assignedTo = userId;
    }

    // ========================================
    // PROJECT TASK
    // ========================================

    else {
      // Validate project ID.
      if (!isValidObjectId(body.projectId)) {
        return NextResponse.json(
          { message: "Invalid project ID." },
          { status: 400 }
        );
      }

      projectId = new ObjectId(body.projectId);

      // Project must belong to the active workspace
      // and the user must have access to it.
      const project = await db.collection("projects").findOne({
        _id: projectId,
        workspaceId,

        $or: [
          { ownerId: userId },
          { "members.userId": userId },
        ],
      });

      if (!project) {
        return NextResponse.json(
          {
            message: "Project not found or access denied.",
          },
          { status: 404 }
        );
      }

      // Check task creation permissions.
      const role = getProjectRole(project, userId);

      if (!canCreateProjectTask(role)) {
        return NextResponse.json(
          {
            message:
              "You do not have permission to create project tasks.",
          },
          { status: 403 }
        );
      }

      // ========================================
      // ASSIGNEE VALIDATION
      // ========================================

      const requestedAssignee = body.assignedTo || user.id;

      if (!isValidObjectId(requestedAssignee)) {
        return NextResponse.json(
          { message: "Invalid assignee ID." },
          { status: 400 }
        );
      }

      assignedTo = new ObjectId(requestedAssignee);

      // Assignee must belong to the project.
      const isMember =
        project.ownerId?.toString() === assignedTo.toString() ||
        project.members?.some(
          (member) =>
            member.userId?.toString() === assignedTo.toString()
        );

      if (!isMember) {
        return NextResponse.json(
          {
            message:
              "Assignee must be a member of this project.",
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // CREATE TASK
    // ========================================

    const task = {
      title: body.title.trim(),
      description: body.description?.trim() || "",

      projectId,

      // Project tasks are associated with the workspace.
      // Personal tasks remain independent.
      workspaceId: projectId ? workspaceId : null,

      assignedTo,
      createdBy: userId,

      priority: body.priority || "Medium",
      status: "To do",

      dueDate: body.dueDate || null,

      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("tasks").insertOne(task);

    return NextResponse.json(
      {
        message: "Task created successfully.",
        task: {
          ...task,
          _id: result.insertedId,
          overdue: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks error:", error);

    return NextResponse.json(
      { message: "Unable to create task." },
      { status: 500 }
    );
  }
}