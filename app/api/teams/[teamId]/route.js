
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

async function getTeamContext(params) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const { teamId } = await params;

  if (
    !ObjectId.isValid(teamId) ||
    String(new ObjectId(teamId)) !== teamId
  ) {
    return {
      error: NextResponse.json(
        { message: "Invalid team ID." },
        { status: 400 }
      ),
    };
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const teamObjectId = new ObjectId(teamId);
  const userObjectId = new ObjectId(user.id);

  const team = await db.collection("teams").findOne({
    _id: teamObjectId,
  });

  if (!team) {
    return {
      error: NextResponse.json(
        { message: "Team not found." },
        { status: 404 }
      ),
    };
  }

  const membership = await db
    .collection("teamMemberships")
    .findOne({
      teamId: teamObjectId,
      userId: userObjectId,
    });

  const isOwner =
    team.ownerId?.toString() === user.id;

  if (!membership && !isOwner) {
    return {
      error: NextResponse.json(
        { message: "You do not have access to this team." },
        { status: 403 }
      ),
    };
  }

  const role = isOwner
    ? "owner"
    : membership?.role || null;

  return {
    db,
    team,
    user,
    role,
    teamObjectId,
  };
}

// GET: Fetch team details and members.
export async function GET(request, { params }) {
  try {
    const context = await getTeamContext(params);

    if (context.error) return context.error;

    const { db, team } = context;

    const members = await db
      .collection("teamMemberships")
      .find({ teamId: team._id })
      .sort({ joinedAt: 1 })
      .project({
        userId: 1,
        name: 1,
        email: 1,
        role: 1,
        joinedAt: 1,
      })
      .toArray();

    return NextResponse.json(
      {
        team,
        members,
        memberCount: members.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/teams/[teamId] error:", error);

    return NextResponse.json(
      { message: "Unable to fetch team details." },
      { status: 500 }
    );
  }
}

// PATCH: Update team details.
export async function PATCH(request, { params }) {
  try {
    const context = await getTeamContext(params);

    if (context.error) return context.error;

    const { db, team, role } = context;

    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Only team owners and admins can update team details.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const allowedFields = ["name"];

    const invalidField = Object.keys(body).find(
      (key) => !allowedFields.includes(key)
    );

    if (invalidField) {
      return NextResponse.json(
        {
          message: `Field "${invalidField}" cannot be updated.`,
        },
        { status: 400 }
      );
    }

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

    await db.collection("teams").updateOne(
      { _id: team._id },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      }
    );

    const updatedTeam = await db.collection("teams").findOne({
      _id: team._id,
    });

    return NextResponse.json(
      {
        message: "Team updated successfully.",
        team: updatedTeam,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/teams/[teamId] error:", error);

    return NextResponse.json(
      { message: "Unable to update team." },
      { status: 500 }
    );
  }
}
