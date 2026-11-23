import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { ensureDefaultWorkspace } from "../../../../lib/workspace";
import {
  isValidObjectId,
  getProjectRole,
  canManageProject,
  canDeleteProject,
} from "../../../../lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

const allowedColors = [
  "indigo",
  "violet",
  "sky",
  "emerald",
  "rose",
  "amber",
];

const editableFields = [
  "name",
  "description",
  "category",
  "priority",
  "color",
  "deadline",
  "archived",
];

// ============================================
// VALIDATION
// ============================================

function validateUpdates(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
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

  if ("name" in body) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return "Project name is required.";
    }

    if (body.name.trim().length > 100) {
      return "Project name cannot exceed 100 characters.";
    }
  }

  if ("description" in body) {
    if (
      typeof body.description !== "string" ||
      body.description.length > 2000
    ) {
      return "Invalid project description.";
    }
  }

  if (
    "category" in body &&
    (typeof body.category !== "string" ||
      body.category.length > 80)
  ) {
    return "Invalid project category.";
  }

  if (
    "priority" in body &&
    !allowedPriorities.includes(body.priority)
  ) {
    return "Invalid project priority.";
  }

  if (
    "color" in body &&
    !allowedColors.includes(body.color)
  ) {
    return "Invalid project color.";
  }

  if (
    "archived" in body &&
    typeof body.archived !== "boolean"
  ) {
    return "Archived must be true or false.";
  }

  if (
    "deadline" in body &&
    body.deadline !== null &&
    body.deadline !== ""
  ) {
    if (
      typeof body.deadline !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)
    ) {
      return "Deadline must use YYYY-MM-DD format.";
    }

    const date = new Date(
      `${body.deadline}T00:00:00.000Z`
    );

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== body.deadline
    ) {
      return "Invalid deadline.";
    }
  }

  return null;
}

// ============================================
// ACTIVE WORKSPACE
// ============================================

async function getActiveWorkspace(db, user) {
  await ensureDefaultWorkspace(db, user.id);

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

  const membership = await db
    .collection("workspaceMembers")
    .findOne({
      workspaceId: workspaceObjectId,
      userId: new ObjectId(user.id),
    });

  if (!membership) {
    return null;
  }

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
// PROJECT CONTEXT
// ============================================

async function getProjectContext(params) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const { projectId } = await params;

  if (!isValidObjectId(projectId)) {
    return {
      error: NextResponse.json(
        { message: "Invalid project ID." },
        { status: 400 }
      ),
    };
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Resolve active workspace.
  const activeWorkspace = await getActiveWorkspace(
    db,
    user
  );

  if (!activeWorkspace) {
    return {
      error: NextResponse.json(
        { message: "Workspace not found or access denied." },
        { status: 403 }
      ),
    };
  }

  const workspaceId = activeWorkspace.workspace._id;
  const userId = new ObjectId(user.id);

  // Fetch project only from active workspace.
  const project = await db.collection("projects").findOne({
    _id: new ObjectId(projectId),
    workspaceId,

    $or: [
      { ownerId: userId },
      { "members.userId": userId },
    ],
  });

  if (!project) {
    return {
      error: NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      ),
    };
  }

  const role = getProjectRole(project, user.id);

  return {
    db,
    project,
    user,
    role,
    workspaceId,
    workspaceMembership: activeWorkspace.membership,
  };
}

// ============================================
// GET: Fetch one project
// ============================================

export async function GET(request, { params }) {
  try {
    const context = await getProjectContext(params);

    if (context.error) {
      return context.error;
    }

    return NextResponse.json(
      { project: context.project },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/projects/[projectId] error:",
      error
    );

    return NextResponse.json(
      { message: "Unable to fetch project." },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH: Update project
// ============================================

export async function PATCH(request, { params }) {
  try {
    const context = await getProjectContext(params);

    if (context.error) {
      return context.error;
    }

    const { db, project, role, workspaceId } = context;

    if (!canManageProject(role)) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to update this project.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validationError = validateUpdates(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === "name") {
        updates.name = value.trim();
      } else if (key === "description") {
        updates.description = value.trim();
      } else if (key === "category") {
        updates.category = value.trim() || "Other";
      } else if (key === "deadline") {
        updates.deadline = value || null;
      } else {
        updates[key] = value;
      }
    }

    updates.updatedAt = new Date();

    // Update only inside the active workspace.
    await db.collection("projects").updateOne(
      {
        _id: project._id,
        workspaceId,
      },
      {
        $set: updates,
      }
    );

    const updatedProject = await db
      .collection("projects")
      .findOne({
        _id: project._id,
        workspaceId,
      });

    return NextResponse.json(
      {
        message: "Project updated successfully.",
        project: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH /api/projects/[projectId] error:",
      error
    );

    return NextResponse.json(
      { message: "Unable to update project." },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Delete project and associated tasks
// ============================================

export async function DELETE(request, { params }) {
  try {
    const context = await getProjectContext(params);

    if (context.error) {
      return context.error;
    }

    const { db, project, role, workspaceId, user } =
      context;

    if (!canDeleteProject(role)) {
      return NextResponse.json(
        {
          message:
            "Only the project owner can delete this project.",
        },
        { status: 403 }
      );
    }

    // Delete only tasks associated with this project.
    await db.collection("tasks").deleteMany({
      projectId: project._id,
    });

    // Delete only the project inside this workspace.
    const result = await db.collection("projects").deleteOne({
      _id: project._id,
      workspaceId,
      ownerId: new ObjectId(user.id),
    });

    if (result.deletedCount !== 1) {
      return NextResponse.json(
        { message: "Unable to delete project." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Project and its tasks deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/projects/[projectId] error:",
      error
    );

    return NextResponse.json(
      { message: "Unable to delete project." },
      { status: 500 }
    );
  }
}