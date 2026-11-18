
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request, { params }) {
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

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const newRole = body?.role;

    if (!["admin", "member"].includes(newRole)) {
      return NextResponse.json(
        { error: "Role must be admin or member" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(userId);
    const currentUserObjectId = new ObjectId(currentUser.id);

    // A user cannot change their own role.
    if (userObjectId.equals(currentUserObjectId)) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 }
      );
    }

    const workspaceMembers = db.collection("workspaceMembers");

    session = client.startSession();

    let updatedMember = null;

    await session.withTransaction(async () => {
      // Verify the current user is the workspace owner.
      const ownerMembership = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: currentUserObjectId,
          role: "owner",
        },
        { session }
      );

      if (!ownerMembership) {
        throw new Error("OWNER_PERMISSION_DENIED");
      }

      // Find the target workspace member.
      const targetMember = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: userObjectId,
        },
        { session }
      );

      if (!targetMember) {
        throw new Error("MEMBER_NOT_FOUND");
      }

      // Workspace owner role cannot be changed.
      if (targetMember.role === "owner") {
        throw new Error("OWNER_ROLE_PROTECTED");
      }

      // Update the member's role.
      const result = await workspaceMembers.updateOne(
        {
          _id: targetMember._id,
          workspaceId: workspaceObjectId,
          userId: userObjectId,
          role: { $in: ["admin", "member"] },
        },
        {
          $set: {
            role: newRole,
          },
        },
        { session }
      );

      if (result.modifiedCount !== 1) {
        if (result.matchedCount === 1) {
          updatedMember = {
            userId: userObjectId,
            role: newRole,
          };
          return;
        }

        throw new Error("ROLE_UPDATE_FAILED");
      }

      updatedMember = {
        userId: userObjectId,
        role: newRole,
      };
    });

    return NextResponse.json(
      {
        message: "Member role updated successfully",
        member: updatedMember,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update workspace member role error:", error);

    const errors = {
      OWNER_PERMISSION_DENIED: {
        message: "Only the workspace owner can change member roles.",
        status: 403,
      },
      MEMBER_NOT_FOUND: {
        message: "Workspace member not found.",
        status: 404,
      },
      OWNER_ROLE_PROTECTED: {
        message: "The workspace owner's role cannot be changed.",
        status: 403,
      },
      ROLE_UPDATE_FAILED: {
        message: "Unable to update member role.",
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
      { error: "Failed to update member role." },
      { status: 500 }
    );

  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
