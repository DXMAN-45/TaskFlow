
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

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

    if (!ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { workspaceId, userId } = await params;

    if (
      !ObjectId.isValid(workspaceId) ||
      !ObjectId.isValid(userId)
    ) {
      return NextResponse.json(
        { error: "Invalid workspace or member ID" },
        { status: 400 }
      );
    }

    const currentUserObjectId = new ObjectId(currentUser.id);
    const workspaceObjectId = new ObjectId(workspaceId);
    const targetUserObjectId = new ObjectId(userId);

    // Prevent users from removing themselves.
    if (currentUserObjectId.equals(targetUserObjectId)) {
      return NextResponse.json(
        { error: "You cannot remove yourself from this workspace." },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const workspaces = db.collection("workspaces");
    const workspaceMembers = db.collection("workspaceMembers");

    session = client.startSession();

    let removedMember = null;

    await session.withTransaction(async () => {
      removedMember = null;

      // Serialize workspace seat operations.
      const lockResult = await workspaces.updateOne(
        { _id: workspaceObjectId },
        {
          $inc: {
            seatVersion: 1,
          },
        },
        { session }
      );

      if (lockResult.matchedCount !== 1) {
        throw new Error("WORKSPACE_NOT_FOUND");
      }

      // Verify the current user's workspace role.
      const currentMembership = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: currentUserObjectId,
        },
        { session }
      );

      if (!currentMembership) {
        throw new Error("ACCESS_DENIED");
      }

      // Find the member being removed.
      const targetMembership = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: targetUserObjectId,
        },
        { session }
      );

      if (!targetMembership) {
        throw new Error("MEMBER_NOT_FOUND");
      }

      // Workspace owner cannot be removed.
      if (targetMembership.role === "owner") {
        throw new Error("OWNER_PROTECTED");
      }

      // Owner can remove admins and members.
      // Admin can remove members only.
      const canRemove =
        currentMembership.role === "owner" ||
        (
          currentMembership.role === "admin" &&
          targetMembership.role === "member"
        );

      if (!canRemove) {
        throw new Error("REMOVE_PERMISSION_DENIED");
      }

      // Remove workspace membership.
      const result = await workspaceMembers.deleteOne(
        {
          _id: targetMembership._id,
          workspaceId: workspaceObjectId,
          userId: targetUserObjectId,
        },
        { session }
      );

      if (result.deletedCount !== 1) {
        throw new Error("MEMBER_REMOVAL_FAILED");
      }

      removedMember = {
        userId: targetUserObjectId,
        previousRole: targetMembership.role,
      };
    });

    return NextResponse.json(
      {
        message: "Workspace member removed successfully.",
        member: removedMember,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Remove workspace member error:", error);

    const errors = {
      WORKSPACE_NOT_FOUND: {
        message: "Workspace not found.",
        status: 404,
      },
      ACCESS_DENIED: {
        message: "You do not have access to this workspace.",
        status: 403,
      },
      MEMBER_NOT_FOUND: {
        message: "Workspace member not found.",
        status: 404,
      },
      OWNER_PROTECTED: {
        message: "The workspace owner cannot be removed.",
        status: 403,
      },
      REMOVE_PERMISSION_DENIED: {
        message: "You do not have permission to remove this member.",
        status: 403,
      },
      MEMBER_REMOVAL_FAILED: {
        message: "Unable to remove workspace member.",
        status: 409,
      },
    };

    const knownError = errors[error.message];

    if (knownError) {
      return NextResponse.json(
        { error: knownError.message },
        { status: knownError.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove workspace member." },
      { status: 500 }
    );

  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
