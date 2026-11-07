
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Sidebar from "../component/Sidebar";
import Sidebarmob from "../component/Sidebarmob";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }
    const client = await clientPromise;
const db = client.db("taskflow");

const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.user.id) },
    {
      projection: {
    googleId: 1,
    githubId: 1,
    githubUsername: 1,
},
    }
);

if (!user) {
    redirect("/login");
}

const googleConnected = Boolean(user.googleId);
const githubConnected = Boolean(user.githubId);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar  />
            <Sidebarmob  />

            <main className="min-w-0 flex-1 overflow-y-auto bg-gray-100 p-5 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <h1 className="text-3xl font-semibold text-slate-800">
                        Account Settings
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Manage your profile, security, and connected accounts.
                    </p>

                    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-800">
                            Profile
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your current TaskFlow account information.
                        </p>

                        <div className="mt-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Name
                                </p>
                                <p className="font-medium text-slate-800">
                                    {session.user.name || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Email
                                </p>
                                <p className="font-medium text-slate-800">
                                    {session.user.email || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    TaskFlow User ID
                                </p>
                                <p className="break-all font-mono text-sm text-slate-700">
                                    {session.user.id}
                                </p>
                            </div>
                        </div>
                    </section>

                
<section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-slate-800">
        Security & Connected Accounts
    </h2>
    <p className="mt-2 text-sm text-slate-500">
        Manage the accounts you use to sign in to TaskFlow.
    </p>

    <div className="mt-6 space-y-4">
        {/* Google */}
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 className="font-medium text-slate-800">
                    Google
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Sign in using your Google account.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span
    className={`rounded-full px-3 py-1 text-sm ${
        googleConnected
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
    }`}
>
    {googleConnected ? "Connected" : "Not connected"}
</span>
                <button
                    type="button"
                    disabled
                    className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-500"
                >
                    Connect Google
                </button>
            </div>
        </div>

        {/* GitHub */}
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 className="font-medium text-slate-800">
                    GitHub
                </h3>
             <p className="mt-1 text-sm text-slate-500">
    {githubConnected
        ? `Connected as @${user.githubUsername || "GitHub user"}`
        : "Sign in using your GitHub account."}
</p>
            </div>

            <div className="flex items-center gap-3">
               <span
    className={`rounded-full px-3 py-1 text-sm ${
        githubConnected
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
    }`}
>
    {githubConnected ? "Connected" : "Not connected"}
</span>
               
<a
    href="/api/link/github"
    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
>
    {githubConnected ? "Reconnect GitHub" : "Connect GitHub"}
</a>

            </div>
        </div>
    </div>

   <p className="mt-4 text-xs text-slate-500">
    Your connected accounts are linked to your existing TaskFlow account.
</p>
</section>

                </div>
            </main>
        </div>
    );
}
