"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                username: username.trim().toLowerCase(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid username or password.");
                return;
            }

            if (result?.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                setError("Unable to sign in. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setError("");
        setGoogleLoading(true);

        try {
            await signIn("google", {
                callbackUrl: "/dashboard",
            });
        } catch {
            setError("Unable to sign in with Google. Please try again.");
            setGoogleLoading(false);
        }
    }

    async function handleGitHubSignIn() {
        setError("");
        setGithubLoading(true);

        try {
            await signIn("github", {
                callbackUrl: "/dashboard",
            });
        } catch {
            setError("Unable to sign in with GitHub. Please try again.");
            setGithubLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back
                </h1>

                <p className="mt-2 text-gray-600">
                    Sign in to continue to TaskFlow.
                </p>
            
                {/* GitHub sign-in */}
                <button
                    type="button"
                    onClick={handleGitHubSignIn}
                    disabled={loading || googleLoading || githubLoading}
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {githubLoading ? (
                        "Connecting to GitHub..."
                    ) : (
                        <>
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 .1.77 2.1 3.3 1.6.1-.74.4-1.25.7-1.54-2.48-.28-5.09-1.24-5.09-5.5 0-1.22.44-2.22 1.16-3-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.1-1.45 3.05-1.15 3.05-1.15.61 1.55.23 2.69.11 2.98.72.78 1.16 1.78 1.16 3 0 4.27-2.61 5.21-5.1 5.49.4.34.76 1.02.76 2.06v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
                            </svg>
                            Continue with GitHub
                        </>
                    )}
                </button>

                {/* Google sign-in */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading || githubLoading}
                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {googleLoading ? (
                        "Connecting to Google..."
                    ) : (
                        <>
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 48 48"
                                className="h-5 w-5"
                            >
                                <path
                                    fill="#EA4335"
                                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.05 13.22l7.98 6.19C12.93 13.72 18.02 9.5 24 9.5Z"
                                    transform="translate(0 5)"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.66 5.94c4.47-4.13 7.1-10.22 7.1-17.59Z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.53 10.78l8-6.19Z"
                                    transform="translate(1 0)"
                                />
                                <path
                                    fill="#34A853"
                                    d="M24 48c6.48 0 11.93-2.13 15.91-5.86l-7.66-5.94c-2.13 1.43-4.84 2.28-8.25 2.28-5.98 0-11.07-4.22-12.97-9.91l-8 6.19C6.51 43.62 14.62 48 24 48Z"
                                />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-sm text-gray-500">OR</span>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || googleLoading || githubLoading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}