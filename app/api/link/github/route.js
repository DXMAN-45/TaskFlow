
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { randomBytes } from "crypto";

export async function GET() {
    const baseUrl =
        process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.redirect(
            new URL("/login", baseUrl)
        );
    }

    if (!process.env.GITHUB_ID) {
        return NextResponse.redirect(
            new URL("/setting?githubLink=config_error", baseUrl)
        );
    }

    const state = randomBytes(32).toString("hex");

    const callbackUrl = new URL(
        "/api/link/github/callback",
        baseUrl
    ).toString();

    const githubUrl = new URL(
        "https://github.com/login/oauth/authorize"
    );

    githubUrl.searchParams.set(
        "client_id",
        process.env.GITHUB_ID
    );
    githubUrl.searchParams.set("redirect_uri", callbackUrl);
    githubUrl.searchParams.set("scope", "read:user user:email");
    githubUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(githubUrl);

    response.cookies.set("taskflow_github_link_state", state, {
        httpOnly: true,
        secure: baseUrl.startsWith("https://"),
        sameSite: "lax",
        path: "/api/link/github/callback",
        maxAge: 600,
    });

    return response;
}
