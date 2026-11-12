
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "../../../lib/mongodb";
import { getCurrentUser } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_NAME = "taskflow";

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

const allowedColors = [
  "indigo",
  "violet",
  "sky",
  "emerald",
  "rose",
  "amber",
];

function validateProject(body) {
  if (
    typeof body.name !== "string" ||
    !body.name.trim()
  ) {
    return "Project name is required.";
  }

  if (body.name.trim().length > 100) {
    return "Project name cannot exceed 100 characters.";
  }

  if (
    body.description !== undefined &&
    (typeof body.description !== "string" ||
      body.description.length > 2000)
  ) {
    return "Invalid project description.";
  }

  if (
    body.priority !== undefined &&
    !allowedPriorities.includes(body.priority)
  ) {
    return "Invalid project priority.";
  }

  if (
    body.color !== undefined &&
    !allowedColors.includes(body.color)
  ) {
    return "Invalid project color.";
  }

  if (
    body.category !== undefined &&
    (typeof body.category !== "string" ||
      body.category.length > 80)
  ) {
    return "Invalid project category.";
  }

  if (
    body.deadline !== undefined &&
    body.deadline !== null &&
    body.deadline !== ""
  ) {
    if (
      typeof body.deadline !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)
    ) {
      return "Deadline must use YYYY-MM-DD format.";
    }

    const date = new Date(`${body.deadline}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== body.deadline
    ) {
      return "Invalid deadline.";
    }
  }

  return null;
}

// GET: Fetch projects belonging to the logged-in user
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

    const projects = await db
      .collection("projects")
      .find({
        $or: [
          { ownerId: userId },
          { "members.userId": userId },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      { projects },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/projects error:", error);

    return NextResponse.json(
      { message: "Unable to fetch projects." },
      { status: 500 }
    );
  }
}

// POST: Create a new project
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

    const validationError = validateProject(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const userId = new ObjectId(user.id);
    const now = new Date();

    const project = {
      name: body.name.trim(),
      description: body.description?.trim() || "",
      category: body.category?.trim() || "Other",
      priority: body.priority || "Medium",
      color: body.color || "indigo",

      // Keep date-only values as strings to avoid timezone shifts.
      deadline: body.deadline || null,

      ownerId: userId,

      members: [
        {
          userId,
          name: user.name || "Project owner",
          role: "owner",
          joinedAt: now,
        },
      ],

      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("projects")
      .insertOne(project);

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project: {
          ...project,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects error:", error);

    return NextResponse.json(
      { message: "Unable to create project." },
      { status: 500 }
    );
  }
}
