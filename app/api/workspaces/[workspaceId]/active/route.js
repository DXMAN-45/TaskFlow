
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

// POST: Switch the user's active workspace.
export async function POST(request) {
  try {
    // 1. Authenticate user.
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate user ID.
    if (!ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // 3. Parse request body.
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

    // 4. Validate workspace ID.
    if (
      typeof workspaceId !== "string" ||
      !ObjectId.isValid(workspaceId)
    ) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    // 5. Connect to MongoDB.
    const client = await clientPromise;
    const db = client.db("taskflow");

    const userObjectId = new ObjectId(currentUser.id);
    const workspaceObjectId = new ObjectId(workspaceId);

    // 6. Verify workspace membership.
    const membership = await db
      .collection("workspaceMembers")
      .findOne({
        workspaceId: workspaceObjectId,
        userId: userObjectId,
      });

    if (!membership) {
      return NextResponse.json(
        {
          error: "You do not have access to this workspace",
        },
        { status: 403 }
      );
    }

    // 7. Confirm that the workspace exists.
    const workspace = await db
      .collection("workspaces")
      .findOne({
        _id: workspaceObjectId,
      });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // 8. Update the user's active workspace.
    const result = await db.collection("users").updateOne(
      { _id: userObjectId },
      {
        $set: {
          activeWorkspaceId: workspaceObjectId,
        },
      }
    );

    // 9. Confirm that the user document was updated.
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 10. Return successful response.
    return NextResponse.json(
      {
        message: "Workspace switched successfully",
        workspace: {
          _id: workspace._id,
          name: workspace.name,
          ownerId: workspace.ownerId,
          plan: workspace.plan,
          isDefault: workspace.isDefault,
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
