
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";

import {
  isValidObjectId,
  getProjectRole,
  canUpdateAssignedTask,
  canDeleteProjectTask,
} from "../../../../lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];
const allowedStatuses = ["To do", "In progress", "Completed"];

const editableFields = [
  "title",
  "description",
  "priority",
  "status",
  "dueDate",
  "assignedTo",
  "projectId",
];

// Validate incoming task updates.
function validateUpdates(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid request body.";
  }

  const keys = Object.keys(body);

  if (keys.length === 0) {
    return "No updates provided.";
  }

  const invalidField = keys.find(
    (key) => !editableFields.includes(key)
  );

  if (invalidField) {
    return `Field "${invalidField}" cannot be updated.`;
  }

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return "Task title is required.";
    }

    if (body.title.trim().length > 150) {
      return "Task title cannot exceed 150 characters.";
    }
  }

  if ("description" in body) {
    if (
      typeof body.description !== "string" ||
      body.description.length > 3000
    ) {
      return "Invalid task description.";
    }
  }

  if (
    "priority" in body &&
    !allowedPriorities.includes(body.priority)
  ) {
    return "Invalid task priority.";
  }

  if (
    "status" in body &&
    !allowedStatuses.includes(body.status)
  ) {
    return "Invalid task status.";
  }

  if (
    "dueDate" in body &&
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

  if (
    "assignedTo" in body &&
    !isValidObjectId(body.assignedTo)
  ) {
    return "Invalid assignee ID.";
  }

  // Allow a valid project ID or null (Personal).
  if (
    "projectId" in body &&
    body.projectId !== null &&
    !isValidObjectId(body.projectId)
  ) {
    return "Invalid project ID.";
  }

  // Moving a task also determines its assignee.
  if ("projectId" in body && "assignedTo" in body) {
    return "You cannot change the project and assignee in the same request.";
  }

  return null;
}

// Get task, user, and project permission context.
async function getTaskContext(params) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const { taskId } = await params;

  if (!isValidObjectId(taskId)) {
    return {
      error: NextResponse.json(
        { message: "Invalid task ID." },
        { status: 400 }
      ),
    };
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const task = await db.collection("tasks").findOne({
    _id: new ObjectId(taskId),
  });

  if (!task) {
    return {
      error: NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      ),
    };
  }

  // Personal task: only its creator can access it.
  if (!task.projectId) {
    if (task.createdBy?.toString() !== user.id) {
      return {
        error: NextResponse.json(
          { message: "Task not found." },
          { status: 404 }
        ),
      };
    }

    return { db, task, user, role: null, project: null };
  }

  // Project task: user must belong to its project.
  const project = await db.collection("projects").findOne({
    _id: task.projectId,
    $or: [
      { ownerId: new ObjectId(user.id) },
      { "members.userId": new ObjectId(user.id) },
    ],
  });

  if (!project) {
    return {
      error: NextResponse.json(
        { message: "Task not found or access denied." },
        { status: 404 }
      ),
    };
  }

  const role = getProjectRole(project, user.id);

  return { db, task, user, role, project };
}

// GET: Fetch one task.
export async function GET(request, { params }) {
  try {
    const context = await getTaskContext(params);

    if (context.error) return context.error;

    const { task } = context;

    const today = new Date().toISOString().slice(0, 10);

    const overdue =
      Boolean(task.dueDate) &&
      task.dueDate < today &&
      task.status !== "Completed";

    return NextResponse.json(
      {
        task: {
          ...task,
          overdue,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/tasks/[taskId] error:", error);

    return NextResponse.json(
      { message: "Unable to fetch task." },
      { status: 500 }
    );
  }
}

// PATCH: Update or move a task.
export async function PATCH(request, { params }) {
  try {
    const context = await getTaskContext(params);

    if (context.error) return context.error;

    const { db, task, user, role, project } = context;

    const body = await request.json();

    const validationError = validateUpdates(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const isPersonalTask = !task.projectId;

    // Handle Personal <-> Project movement.
    if ("projectId" in body) {
      // PERSONAL -> PROJECT
      if (isPersonalTask) {
        if (body.projectId === null) {
          return NextResponse.json(
            { message: "This task is already Personal." },
            { status: 400 }
          );
        }

        const destinationProject = await db
          .collection("projects")
          .findOne({
            _id: new ObjectId(body.projectId),
            archived: { $ne: true },
            $or: [
              { ownerId: new ObjectId(user.id) },
              { "members.userId": new ObjectId(user.id) },
            ],
          });

        if (!destinationProject) {
          return NextResponse.json(
            {
              message:
                "Project not found or you do not have access to it.",
            },
            { status: 404 }
          );
        }

        const destinationRole = getProjectRole(
          destinationProject,
          user.id
        );

        if (
          destinationRole !== "owner" &&
          destinationRole !== "admin"
        ) {
          return NextResponse.json(
            {
              message:
                "Only project owners and admins can move tasks into a project.",
            },
            { status: 403 }
          );
        }
      } else {
        // PROJECT -> PERSONAL
        if (body.projectId !== null) {
          return NextResponse.json(
            {
              message:
                "Moving tasks between projects is not supported yet.",
            },
            { status: 400 }
          );
        }

        if (role !== "owner" && role !== "admin") {
          return NextResponse.json(
            {
              message:
                "Only project owners and admins can move tasks to Personal.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Check permission to update the existing task.
    if (isPersonalTask) {
      if (task.createdBy?.toString() !== user.id) {
        return NextResponse.json(
          { message: "You cannot update this task." },
          { status: 403 }
        );
      }
    } else {
      const canUpdate = canUpdateAssignedTask(
        role,
        task.assignedTo,
        user.id
      );

      if (!canUpdate) {
        return NextResponse.json(
          { message: "You cannot update this task." },
          { status: 403 }
        );
      }

      // Assigned project members can only update status.
      if (role === "member") {
        const requestedFields = Object.keys(body);

        if (
          requestedFields.some((field) => field !== "status")
        ) {
          return NextResponse.json(
            {
              message:
                "Project members can only update the status of their assigned tasks.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Personal tasks cannot be reassigned directly.
    if (isPersonalTask && "assignedTo" in body) {
      return NextResponse.json(
        { message: "Personal tasks cannot be reassigned." },
        { status: 400 }
      );
    }

    // Only project owners and admins can reassign project tasks.
    if ("assignedTo" in body) {
      if (!project || (role !== "owner" && role !== "admin")) {
        return NextResponse.json(
          { message: "You cannot reassign this task." },
          { status: 403 }
        );
      }

      const isMember =
        project.ownerId?.toString() === body.assignedTo ||
        project.members?.some(
          (member) =>
            member.userId?.toString() === body.assignedTo
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

    // Prepare database updates.
    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === "title" || key === "description") {
        updates[key] = value.trim();
      } else if (key === "dueDate") {
        updates.dueDate = value || null;
      } else if (key === "projectId") {
        // null means Personal; otherwise convert to ObjectId.
        updates.projectId = value
          ? new ObjectId(value)
          : null;
      } else if (key === "assignedTo") {
        updates.assignedTo = new ObjectId(value);
      } else {
        updates[key] = value;
      }
    }

    // When moving a task, the person moving it becomes its assignee.
    if ("projectId" in body) {
      updates.assignedTo = new ObjectId(user.id);
    }

    updates.updatedAt = new Date();

    await db.collection("tasks").updateOne(
      { _id: task._id },
      { $set: updates }
    );

    const updatedTask = await db.collection("tasks").findOne({
      _id: task._id,
    });

    const today = new Date().toISOString().slice(0, 10);

    const overdue =
      Boolean(updatedTask.dueDate) &&
      updatedTask.dueDate < today &&
      updatedTask.status !== "Completed";

    return NextResponse.json(
      {
        message: "Task updated successfully.",
        task: {
          ...updatedTask,
          overdue,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/tasks/[taskId] error:", error);

    return NextResponse.json(
      { message: "Unable to update task." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a task.
export async function DELETE(request, { params }) {
  try {
    const context = await getTaskContext(params);

    if (context.error) return context.error;

    const { db, task, user, role } = context;

    if (task.projectId) {
      if (!canDeleteProjectTask(role)) {
        return NextResponse.json(
          {
            message:
              "Only project owners and admins can delete project tasks.",
          },
          { status: 403 }
        );
      }
    } else {
      if (task.createdBy?.toString() !== user.id) {
        return NextResponse.json(
          { message: "You cannot delete this task." },
          { status: 403 }
        );
      }
    }

    await db.collection("tasks").deleteOne({
      _id: task._id,
    });

    return NextResponse.json(
      { message: "Task deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/tasks/[taskId] error:", error);

    return NextResponse.json(
      { message: "Unable to delete task." },
      { status: 500 }
    );
  }
}
