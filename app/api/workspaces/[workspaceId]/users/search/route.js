
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import { ensureWorkspaceIndexes } from "@/lib/workspace";
import { expireWorkspaceInvitations } from "@/lib/invitations";

// Escape special regex characters so usernames are treated literally.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET: Search existing TaskFlow users by username.
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    if (
      typeof query !== "string" ||
      query.length < 2 ||
      query.length > 20 ||
      !/^[a-z0-9_]+$/.test(query)
    ) {
      return NextResponse.json(
        {
          error: "Search must be 2–20 characters and contain only letters, numbers, or underscores.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskflow");

    await ensureWorkspaceIndexes(db);

    const workspaceObjectId = new ObjectId(workspaceId);
    const userObjectId = new ObjectId(currentUser.id);

    // Only workspace owners and admins can search for users.
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
        { error: "You do not have permission to search users." },
        { status: 403 }
      );
    }

    // Clean up expired invitations before filtering search results.
    await expireWorkspaceInvitations(
      db,
      workspaceObjectId
    );

    // Get existing workspace members.
    const members = await db.collection("workspaceMembers")
      .find(
        { workspaceId: workspaceObjectId },
        { projection: { userId: 1 } }
      )
      .toArray();

    const memberIds = members.map((member) => member.userId);

    // Get users who already have pending invitations.
    const pendingInvitations = await db.collection("invitations")
      .find(
        {
          workspaceId: workspaceObjectId,
          status: "pending",
          expiresAt: { $gt: new Date() },
        },
        { projection: { invitedUserId: 1 } }
      )
      .toArray();

    const pendingUserIds = pendingInvitations.map(
      (invitation) => invitation.invitedUserId
    );

    const excludedIds = [
      ...memberIds,
      ...pendingUserIds,
      userObjectId,
    ];

    // Search usernames by prefix, returning only safe profile fields.
    const users = await db.collection("users")
      .find(
        {
          _id: { $nin: excludedIds },
          username: {
            $regex: `^${escapeRegex(query)}`,
            $options: "i",
          },
        },
        {
          projection: {
            _id: 1,
            username: 1,
            name: 1,
            image: 1,
          },
        }
      )
      .limit(10)
      .toArray();

    return NextResponse.json(
      {
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search workspace users error:", error);

    return NextResponse.json(
      { error: "Failed to search users." },
      { status: 500 }
    );
  }
}
