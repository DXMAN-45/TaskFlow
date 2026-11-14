
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

// GET: Retrieve workspace details.
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;

    if (!ObjectId.isValid(workspaceId)) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(currentUser.id);

    // Verify workspace membership.
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const workspace = await db.collection("workspaces").findOne({
      _id: workspaceObjectId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const memberCount = await db
      .collection("workspaceMembers")
      .countDocuments({
        workspaceId: workspaceObjectId,
      });

    return NextResponse.json(
      {
        workspace: {
          ...workspace,
          memberCount,
          role: membership.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workspace error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve workspace" },
      { status: 500 }
    );
  }
}

// PATCH: Rename a workspace.
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;

    if (!ObjectId.isValid(workspaceId)) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
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

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(currentUser.id);

    // Only the owner can rename the workspace.
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
      role: "owner",
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only the workspace owner can rename this workspace" },
        { status: 403 }
      );
    }

    const result = await db.collection("workspaces").updateOne(
      { _id: workspaceObjectId },
      {
        $set: {
          name: name.trim(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const updatedWorkspace = await db.collection("workspaces").findOne({
      _id: workspaceObjectId,
    });

    return NextResponse.json(
      {
        message: "Workspace updated successfully",
        workspace: updatedWorkspace,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update workspace error:", error);

    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an eligible workspace.
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;

    if (!ObjectId.isValid(workspaceId)) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(currentUser.id);

    // Only the owner can delete a workspace.
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
      role: "owner",
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only the workspace owner can delete this workspace" },
        { status: 403 }
      );
    }

    const workspace = await db.collection("workspaces").findOne({
      _id: workspaceObjectId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Default workspaces cannot be deleted.
    if (workspace.isDefault) {
      return NextResponse.json(
        { error: "The default workspace cannot be deleted" },
        { status: 400 }
      );
    }

    // Do not delete a workspace containing projects.
    const projectCount = await db.collection("projects").countDocuments({
      workspaceId: workspaceObjectId,
    });

    if (projectCount > 0) {
      return NextResponse.json(
        {
          error: "Move or delete all projects before deleting this workspace",
        },
        { status: 409 }
      );
    }

    // Do not delete a workspace with pending invitations.
    const invitationCount = await db.collection("invitations").countDocuments({
      workspaceId: workspaceObjectId,
      status: "pending",
    });

    if (invitationCount > 0) {
      return NextResponse.json(
        {
          error: "Cancel pending invitations before deleting this workspace",
        },
        { status: 409 }
      );
    }

    // Remove workspace memberships.
    await db.collection("workspaceMembers").deleteMany({
      workspaceId: workspaceObjectId,
    });

    // Remove any invitations associated with this workspace.
    await db.collection("invitations").deleteMany({
      workspaceId: workspaceObjectId,
    });

    // Delete the workspace.
    await db.collection("workspaces").deleteOne({
      _id: workspaceObjectId,
    });

    return NextResponse.json(
      { message: "Workspace deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete workspace error:", error);

    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
