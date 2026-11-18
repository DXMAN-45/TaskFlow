
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import {
  ensureOwnedWorkspaceCount,
} from "@/lib/workspace";

// ============================================
// GET: RETRIEVE WORKSPACE DETAILS
// ============================================

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

    if (
      !ObjectId.isValid(workspaceId) ||
      !ObjectId.isValid(currentUser.id)
    ) {
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

// ============================================
// PATCH: RENAME WORKSPACE
// ============================================

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

    if (
      !ObjectId.isValid(workspaceId) ||
      !ObjectId.isValid(currentUser.id)
    ) {
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
        {
          error: "Only the workspace owner can rename this workspace",
        },
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

// ============================================
// DELETE: SAFELY DELETE WORKSPACE
// ============================================

export async function DELETE(request, { params }) {
  let session;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;

    if (
      !ObjectId.isValid(workspaceId) ||
      !ObjectId.isValid(currentUser.id)
    ) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(currentUser.id);

    // Initialise ownership count for older accounts.
    await ensureOwnedWorkspaceCount(db, currentUser.id);

    session = client.startSession();

    let outcome = null;

    await session.withTransaction(async () => {
      outcome = null;

      const workspaces = db.collection("workspaces");
      const workspaceMembers = db.collection("workspaceMembers");
      const invitations = db.collection("invitations");
      const projects = db.collection("projects");
      const users = db.collection("users");

      // Verify ownership.
      const membership = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: userObjectId,
          role: "owner",
        },
        { session }
      );

      if (!membership) {
        outcome = {
          status: 403,
          body: {
            error: "Only the workspace owner can delete this workspace",
          },
        };
        return;
      }

      const workspace = await workspaces.findOne(
        {
          _id: workspaceObjectId,
        },
        { session }
      );

      if (!workspace) {
        outcome = {
          status: 404,
          body: { error: "Workspace not found" },
        };
        return;
      }

      // Verify workspace ownerId as an additional safeguard.
      if (
        !workspace.ownerId ||
        workspace.ownerId.toString() !== userObjectId.toString()
      ) {
        outcome = {
          status: 403,
          body: { error: "Workspace ownership verification failed" },
        };
        return;
      }

      // Default workspaces cannot be deleted.
      if (workspace.isDefault) {
        outcome = {
          status: 400,
          body: {
            error: "The default workspace cannot be deleted",
          },
        };
        return;
      }

      // Do not delete a workspace containing projects.
      const projectCount = await projects.countDocuments(
        {
          workspaceId: workspaceObjectId,
        },
        { session }
      );

      if (projectCount > 0) {
        outcome = {
          status: 409,
          body: {
            error: "Move or delete all projects before deleting this workspace",
          },
        };
        return;
      }

      // Do not delete a workspace with pending invitations.
      const invitationCount = await invitations.countDocuments(
        {
          workspaceId: workspaceObjectId,
          status: "pending",
        },
        { session }
      );

      if (invitationCount > 0) {
        outcome = {
          status: 409,
          body: {
            error: "Cancel pending invitations before deleting this workspace",
          },
        };
        return;
      }

      // Find the owner's account.
      const user = await users.findOne(
        {
          _id: userObjectId,
        },
        { session }
      );

      if (!user) {
        outcome = {
          status: 404,
          body: { error: "User not found" },
        };
        return;
      }

      // If this is the active workspace, find the default workspace.
      const isActiveWorkspace =
        user.activeWorkspaceId?.toString() ===
        workspaceObjectId.toString();

      let defaultWorkspace = null;

      if (isActiveWorkspace) {
        defaultWorkspace = await workspaces.findOne(
          {
            ownerId: userObjectId,
            isDefault: true,
          },
          { session }
        );

        if (!defaultWorkspace) {
          outcome = {
            status: 409,
            body: {
              error: "Unable to find your default workspace. Deletion cancelled.",
            },
          };
          return;
        }
      }

      // Decrement the ownership counter atomically.
      const counterResult = await users.updateOne(
        {
          _id: userObjectId,
          ownedWorkspaceCount: { $gt: 0 },
        },
        {
          $inc: {
            ownedWorkspaceCount: -1,
          },
        },
        { session }
      );

      if (counterResult.matchedCount !== 1) {
        throw new Error(
          "Unable to update workspace ownership counter."
        );
      }

      // Remove workspace memberships.
      await workspaceMembers.deleteMany(
        {
          workspaceId: workspaceObjectId,
        },
        { session }
      );

      // Remove all invitations associated with this workspace.
      await invitations.deleteMany(
        {
          workspaceId: workspaceObjectId,
        },
        { session }
      );

      // Delete the workspace.
      const deleteResult = await workspaces.deleteOne(
        {
          _id: workspaceObjectId,
          ownerId: userObjectId,
        },
        { session }
      );

      if (deleteResult.deletedCount !== 1) {
        throw new Error("Workspace deletion failed.");
      }

      // Update active workspace if necessary.
      if (isActiveWorkspace) {
        await users.updateOne(
          {
            _id: userObjectId,
          },
          {
            $set: {
              activeWorkspaceId: defaultWorkspace._id,
              defaultWorkspaceId: defaultWorkspace._id,
            },
          },
          { session }
        );
      }

      outcome = {
        status: 200,
        body: {
          message: "Workspace deleted successfully",
        },
      };
    });

    if (!outcome) {
      throw new Error("Workspace deletion transaction did not complete.");
    }

    return NextResponse.json(
      outcome.body,
      { status: outcome.status }
    );
  } catch (error) {
    console.error("Delete workspace error:", error);

    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
