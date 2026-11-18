
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getUserInvitations } from "@/lib/invitations";

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

    const invitations = await getUserInvitations(
      db,
      currentUser.id
    );

    return NextResponse.json(
      { invitations },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get received invitations error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve received invitations." },
      { status: 500 }
    );
  }
}
