
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../lib/mongodb";
import { getCurrentUser } from "../../../lib/auth";
import {
  isValidObjectId,
  getProjectRole,
  canCreateProjectTask,
} from "../../../lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid request body.";
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
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

// GET: Fetch personal and project tasks
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

    // Find projects the current user belongs to.
    const projects = await db.collection("projects")
      .find({
        $or: [
          { ownerId: userId },
          { "members.userId": userId },
        ],
      })
      .project({ _id: 1 })
      .toArray();

    const projectIds = projects.map((project) => project._id);

    const tasks = await db.collection("tasks")
      .find({
        $or: [
          { createdBy: userId, projectId: null },
          { projectId: { $in: projectIds } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

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
      { tasks: formattedTasks },
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

// POST: Create a personal or project task
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

    let projectId = null;
    let assignedTo = userId;

    // Personal task: always belongs to the logged-in user.
    if (body.projectId === undefined || body.projectId === null || body.projectId === "") {
      projectId = null;
      assignedTo = userId;
    } else {
      // Project task: validate the project ID.
      if (!isValidObjectId(body.projectId)) {
        return NextResponse.json(
          { message: "Invalid project ID." },
          { status: 400 }
        );
      }

      projectId = new ObjectId(body.projectId);

      const project = await db.collection("projects").findOne({
        _id: projectId,
        $or: [
          { ownerId: userId },
          { "members.userId": userId },
        ],
      });

      if (!project) {
        return NextResponse.json(
          { message: "Project not found or access denied." },
          { status: 404 }
        );
      }

      const role = getProjectRole(project, userId);

      if (!canCreateProjectTask(role)) {
        return NextResponse.json(
          { message: "You do not have permission to create project tasks." },
          { status: 403 }
        );
      }

      // A project task must be assigned to a project member.
      const requestedAssignee = body.assignedTo || user.id;

      if (!isValidObjectId(requestedAssignee)) {
        return NextResponse.json(
          { message: "Invalid assignee ID." },
          { status: 400 }
        );
      }

      assignedTo = new ObjectId(requestedAssignee);

      const isMember =
        project.ownerId?.toString() === assignedTo.toString() ||
        project.members?.some(
          (member) => member.userId?.toString() === assignedTo.toString()
        );

      if (!isMember) {
        return NextResponse.json(
          { message: "Assignee must be a member of this project." },
          { status: 400 }
        );
      }
    }

    const task = {
      title: body.title.trim(),
      description: body.description?.trim() || "",
      projectId,
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
