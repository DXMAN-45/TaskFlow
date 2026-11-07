
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
const baseUrl =
    process.env.NEXTAUTH_URL || "http://localhost:3000";

  const settingsUrl = new URL("/setting", baseUrl);

  const callbackUrl = new URL(
    "/api/link/github/callback",
    baseUrl
  ).toString();

  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get(
    "taskflow_github_link_state"
  )?.value;

  const response = (message) => {
    settingsUrl.searchParams.set("githubLink", message);
    const result = NextResponse.redirect(settingsUrl);
    result.cookies.delete("taskflow_github_link_state");
    return result;
  };

  if (!code || !state || !savedState || state !== savedState) {
    return response("invalid_request");
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) {
    return response("not_signed_in");
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_ID,
          client_secret: process.env.GITHUB_SECRET,
          code,
          redirect_uri: callbackUrl,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      return response("github_error");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return response("github_error");
    }

    const githubResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!githubResponse.ok) {
      return response("github_error");
    }

    const githubUser = await githubResponse.json();

    if (!githubUser.id) {
      return response("github_error");
    }

    const client = await clientPromise;
    const db = client.db("taskflow");
    const users = db.collection("users");
    const githubId = String(githubUser.id);
    const currentUserId = new ObjectId(session.user.id);

    const existingLink = await users.findOne({
      githubId,
      _id: { $ne: currentUserId },
    });

    if (existingLink) {
      return response("already_linked");
    }

    const updateResult = await users.updateOne(
      {
        _id: currentUserId,
        $or: [
          { githubId: { $exists: false } },
          { githubId: null },
          { githubId },
        ],
      },
      {
        $set: {
          githubId,
          githubUsername: githubUser.login,
        },
      }
    );

    if (updateResult.matchedCount !== 1) {
      return response("account_conflict");
    }

    return response("success");
  } catch (error) {
    console.error("GitHub account linking failed:", error);
    return response("github_error");
  }
}
