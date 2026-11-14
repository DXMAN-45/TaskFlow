
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import {
  ensureWorkspaceIndexes,
  ensureDefaultWorkspace,
  createWorkspace,
  getUserWorkspaces,
} from "@/lib/workspace";

// GET: Retrieve all workspaces belonging to the logged-in user.
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    await ensureWorkspaceIndexes(db);

    // Ensure the user has a default workspace.
    await ensureDefaultWorkspace(db, currentUser.id);

    // Retrieve all accessible workspaces.
    const workspaces = await getUserWorkspaces(
      db,
      currentUser.id
    );

    return NextResponse.json(
      { workspaces },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workspaces error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve workspaces" },
      { status: 500 }
    );
  }
}

// POST: Create another workspace for the logged-in user.
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const name = body?.name;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 50
    ) {
      return NextResponse.json(
        {
          error: "Workspace name must be between 1 and 50 characters",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    await ensureWorkspaceIndexes(db);

    // Find the authenticated user in MongoDB.
    const user = await db.collection("users").findOne({
      _id: new ObjectId(currentUser.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a non-default workspace.
    const workspace = await createWorkspace({
      db,
      user,
      name: name.trim(),
      isDefault: false,
    });

    return NextResponse.json(
      {
        message: "Workspace created successfully",
        workspace,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create workspace error:", error);

    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
