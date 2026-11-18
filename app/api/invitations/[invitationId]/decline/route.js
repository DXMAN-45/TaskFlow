
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import {
  declineWorkspaceInvitation,
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

    if (!ObjectId.isValid(invitationId)) {
      return NextResponse.json(
        { error: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    const invitation = await declineWorkspaceInvitation({
      client,
      db,
      invitationId,
      userId: currentUser.id,
    });

    return NextResponse.json(
      {
        message: "Invitation declined successfully.",
        invitation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Decline invitation error:", error);

    if (error instanceof InvitationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to decline invitation." },
      { status: 500 }
    );
  }
}
