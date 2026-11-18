
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

// GET: Retrieve all members of a workspace.
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

    // Verify that the current user belongs to this workspace.
    const membership = await db
      .collection("workspaceMembers")
      .findOne({
        workspaceId: workspaceObjectId,
        userId: userObjectId,
      });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace not found or access denied." },
        { status: 403 }
      );
    }

    // Retrieve workspace members and their safe profile fields.
    const members = await db
      .collection("workspaceMembers")
      .aggregate([
        {
          $match: {
            workspaceId: workspaceObjectId,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            role: 1,
            joinedAt: 1,
            username: "$user.username",
            name: {
              $ifNull: [
                "$user.name",
                "$name",
              ],
            },
            image: "$user.image",
          },
        },
        {
          $sort: {
            joinedAt: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json(
      {
        workspaceId,
        memberCount: members.length,
        members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workspace members error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve workspace members." },
      { status: 500 }
    );
  }
}
