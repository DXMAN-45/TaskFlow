
"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    key: "overview",
    icon: "/sidebar/overview.png",
  },
   {
    name: "Workspaces",
    href: "/workspaces",
    key: "workspaces",
    icon: "/sidebar/workspaces.png",
  },
  {
    name: "My tasks",
    href: "/tasks",
    key: "tasks",
    icon: "/sidebar/tasks.png",
  },
  {
    name: "Team",
    href: "/team",
    key: "team",
    icon: "/sidebar/teams.png",
  },
  {
    name: "Projects",
    href: "/projects",
    key: "projects",
    icon: "/sidebar/projects.png",
  },
];

const Sidebar = ({ active }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  const userName = session?.user?.name || "User";

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col justify-between border-r border-slate-800 bg-[#0F172A] p-4 text-white lg:flex xl:w-[270px]">

      {/* Top Section */}
      <div>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/5"
        >
          <Image
            src="/icon.png"
            alt="TaskFlow logo"
            width={46}
            height={46}
            priority
            className="h-10 w-10 object-contain"
          />

          <span className="text-2xl font-extrabold tracking-tight">
            Task<span className="text-cyan-400">Flow</span>
          </span>
        </Link>

        {/* Workspace Label */}
        <div className="mb-3 mt-10 px-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Dashboard navigation">
          <ul className="flex flex-col gap-2">

            {navigation.map((item) => {
              const isActive = active === item.key;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/25 to-cyan-500/10 text-white shadow-inner shadow-blue-500/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >

                    {/* Active Indicator */}
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-cyan-400" />
                    )}

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-500/20"
                          : "bg-white/5 group-hover:bg-white/10"
                      }`}
                    >
                      <Image
                        src={item.icon}
                        alt=""
                        width={21}
                        height={21}
                        className={`object-contain transition-all ${
                          isActive
                            ? "invert"
                            : "invert opacity-60 group-hover:opacity-100"
                        }`}
                      />
                    </span>

                    <span>{item.name}</span>

                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                    )}

                  </Link>
                </li>
              );
            })}

          </ul>
        </nav>

      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">

        {/* User Profile */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]">

          <div className="flex items-center gap-3">

            {/* Profile Image / Initials */}
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={42}
                height={42}
                className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-md">
                {initials}
              </div>
            )}

            {/* User Details */}
            <div className="min-w-0 flex-1">

              <h3 className="truncate text-sm font-bold text-slate-100">
                {userName}
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                TaskFlow Member
              </p>

            </div>

            {/* Settings */}
            <Link
              href="/setting"
              aria-label="Setting"
              title="Setting"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-cyan-400 active:scale-95"
            >
              <Image
                src="/sidebar/setting.png"
                alt=""
                width={21}
                height={21}
                className="object-contain invert opacity-70 transition-opacity hover:opacity-100"
              />
            </Link>

          </div>

          {/* Hover Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-2 z-50 mb-2 hidden max-w-[230px] break-words rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 xl:block">
            {userName}
            <p className="mt-1 text-slate-400">TaskFlow Member</p>
          </div>

        </div>

        {/* Sign Out */}
        <div className="border-t border-slate-700 pt-3">

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98]"
          >

            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-colors group-hover:bg-red-500/10">
              <Image
                src="/sidebar/exit.png"
                alt=""
                width={19}
                height={19}
                className="object-contain invert opacity-60 transition-opacity group-hover:opacity-100"
              />
            </span>

            Sign out

          </button>

          <p className="mt-3 text-center text-[10px] font-medium tracking-wide text-slate-600">
            TASKFLOW · WORK SMARTER
          </p>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;
