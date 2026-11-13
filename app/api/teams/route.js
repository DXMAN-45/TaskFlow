
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../lib/mongodb";
import { getCurrentUser } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

// GET: Fetch all teams belonging to the current user.
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const userId = new ObjectId(user.id);

    const memberships = await db
      .collection("teamMemberships")
      .find({ userId })
      .sort({ joinedAt: 1 })
      .toArray();

    if (memberships.length === 0) {
      return NextResponse.json(
        { teams: [] },
        { status: 200 }
      );
    }

    const teamIds = memberships.map(
      (membership) => membership.teamId
    );

    const teams = await db
      .collection("teams")
      .find({ _id: { $in: teamIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedTeams = await Promise.all(
      teams.map(async (team) => {
        const membership = memberships.find(
          (item) =>
            item.teamId.toString() === team._id.toString()
        );

        const memberCount = await db
          .collection("teamMemberships")
          .countDocuments({ teamId: team._id });

        return {
          ...team,
          role: membership?.role || "member",
          memberCount,
        };
      })
    );

    return NextResponse.json(
      { teams: formattedTeams },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/teams error:", error);

    return NextResponse.json(
      { message: "Unable to fetch teams." },
      { status: 500 }
    );
  }
}

// POST: Create a new team.
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        { message: "Team name is required." },
        { status: 400 }
      );
    }

    const name = body.name.trim();

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json(
        {
          message:
            "Team name must be between 2 and 60 characters.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const userId = new ObjectId(user.id);
    const now = new Date();

    const team = {
      name,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    };

    const teamResult = await db
      .collection("teams")
      .insertOne(team);

    const membership = {
      teamId: teamResult.insertedId,
      userId,
      name: user.name || "Team owner",
      email: user.email || "",
      role: "owner",
      joinedAt: now,
    };

    try {
      await db
        .collection("teamMemberships")
        .insertOne(membership);
    } catch (error) {
      // Roll back team creation if membership creation fails.
      await db.collection("teams").deleteOne({
        _id: teamResult.insertedId,
      });

      throw error;
    }

    return NextResponse.json(
      {
        message: "Team created successfully.",
        team: {
          ...team,
          _id: teamResult.insertedId,
          role: "owner",
          memberCount: 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/teams error:", error);

    return NextResponse.json(
      { message: "Unable to create team." },
      { status: 500 }
    );
  }
}
