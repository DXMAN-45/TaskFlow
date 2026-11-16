
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

// POST: Switch the user's active workspace.
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

    const { workspaceId } = body || {};

    if (
      typeof workspaceId !== "string" ||
      !ObjectId.isValid(workspaceId)
    ) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const userObjectId = new ObjectId(currentUser.id);
    const workspaceObjectId = new ObjectId(workspaceId);

    // Verify workspace membership.
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this workspace" },
        { status: 403 }
      );
    }

    // Confirm that the workspace exists.
    const workspace = await db.collection("workspaces").findOne({
      _id: workspaceObjectId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Save the active workspace for this user.
    await db.collection("users").updateOne(
      { _id: userObjectId },
      {
        $set: {
          activeWorkspaceId: workspaceObjectId,
        },
      }
    );

    return NextResponse.json(
      {
        message: "Workspace switched successfully",
        workspace: {
          ...workspace,
          role: membership.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Switch workspace error:", error);

    return NextResponse.json(
      { error: "Failed to switch workspace" },
      { status: 500 }
    );
  }
}
