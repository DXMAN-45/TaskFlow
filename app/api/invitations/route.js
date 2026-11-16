
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import { ensureWorkspaceIndexes } from "@/lib/workspace";

import {
  createWorkspaceInvitation,
  getWorkspaceInvitations,
  InvitationError,
} from "@/lib/invitations";

// POST: Send an invitation to an existing TaskFlow user.
export async function POST(request, { params }) {
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
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const invitedUserId = body?.invitedUserId;
    const role = body?.role;

    if (
      typeof invitedUserId !== "string" ||
      !ObjectId.isValid(invitedUserId)
    ) {
      return NextResponse.json(
        { error: "A valid invitedUserId is required." },
        { status: 400 }
      );
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin or member." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    await ensureWorkspaceIndexes(db);

    const invitation = await createWorkspaceInvitation({
      client,
      db,
      workspaceId,
      inviterId: currentUser.id,
      invitedUserId,
      role,
    });

    return NextResponse.json(
      {
        message: "Invitation sent successfully.",
        invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create workspace invitation error:", error);

    if (error instanceof InvitationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to send invitation." },
      { status: 500 }
    );
  }
}


// GET: Retrieve invitations sent for a workspace.
export async function GET(request, { params }) {
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

    // Verify workspace membership and permissions.
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this workspace." },
        { status: 403 }
      );
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to view invitations." },
        { status: 403 }
      );
    }

    const invitations = await getWorkspaceInvitations(
      db,
      workspaceId
    );

    return NextResponse.json(
      { invitations },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workspace invitations error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve workspace invitations." },
      { status: 500 }
    );
  }
}

