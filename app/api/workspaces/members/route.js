
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { ensureDefaultWorkspace } from "../../../../lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { message: "Invalid user." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await ensureDefaultWorkspace(db, user.id);

    const userId = new ObjectId(user.id);

    const userDocument = await db.collection("users").findOne({
      _id: userId,
    });

    const activeWorkspaceId = userDocument?.activeWorkspaceId;

    if (!activeWorkspaceId || !ObjectId.isValid(activeWorkspaceId)) {
      return NextResponse.json(
        { message: "Active workspace not found." },
        { status: 404 }
      );
    }

    const workspaceId = new ObjectId(activeWorkspaceId);

    // Verify that the current user belongs to this workspace.
    const currentMembership = await db
      .collection("workspaceMembers")
      .findOne({
        workspaceId,
        userId,
      });

    if (!currentMembership) {
      return NextResponse.json(
        { message: "Workspace access denied." },
        { status: 403 }
      );
    }

    const workspace = await db.collection("workspaces").findOne({
      _id: workspaceId,
    });

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found." },
        { status: 404 }
      );
    }

    const members = await db
      .collection("workspaceMembers")
      .find({ workspaceId })
      .sort({ joinedAt: 1 })
      .toArray();

    return NextResponse.json(
      {
        workspaceId: workspaceId.toString(),
        members: members.map((member) => ({
          userId: member.userId.toString(),
          name: member.name || "Workspace member",
          email: member.email || "",
          workspaceRole: member.role || "member",
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/workspaces/members error:", error);

    return NextResponse.json(
      { message: "Unable to fetch workspace members." },
      { status: 500 }
    );
  }
}
