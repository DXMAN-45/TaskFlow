
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import {
  revokeWorkspaceInvitation,
  InvitationError,
} from "@/lib/invitations";

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

    const { invitationId } = await params;
const { searchParams } = new URL(request.url);
const workspaceId = searchParams.get("workspaceId");

    if (
      !ObjectId.isValid(workspaceId) ||
      !ObjectId.isValid(invitationId)
    ) {
      return NextResponse.json(
        { error: "Invalid workspace or invitation ID." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const invitation = await revokeWorkspaceInvitation({
      client,
      db,
      workspaceId,
      invitationId,
      userId: currentUser.id,
    });

    return NextResponse.json(
      {
        message: "Invitation revoked successfully.",
        invitation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Revoke invitation error:", error);

    if (error instanceof InvitationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to revoke invitation." },
      { status: 500 }
    );
  }
}
