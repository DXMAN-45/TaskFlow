
"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    key: "overview",
    icon: "/sidebar/overview.png",
  },
  {
    label: "My tasks",
    href: "/tasks",
    key: "tasks",
    icon: "/sidebar/tasks.png",
  },
  {
    label: "Team",
    href: "/team",
    key: "team",
    icon: "/sidebar/teams.png",
  },
  {
    label: "Projects",
    href: "/projects",
    key: "projects",
    icon: "/sidebar/projects.png",
  },
];

const Sidebarmob = ({ active }) => {
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
    <aside className="fixed inset-y-0 left-0 z-40 flex h-dvh w-[76px] shrink-0 flex-col justify-between border-r border-white/10 bg-[#0F172A] px-2 py-4 shadow-xl lg:hidden">

      {/* Top section */}
      <section>
        {/* Logo */}
        <Link
          href="/dashboard"
          aria-label="TaskFlow dashboard"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Image
            src="/icon.png"
            alt="TaskFlow"
            width={42}
            height={42}
            priority
            className="h-10 w-10 rounded-xl object-contain"
          />
        </Link>

        {/* Divider */}
        <div className="mx-2 my-5 h-px bg-white/10" />

        {/* Navigation */}
        <nav aria-label="Main navigation">
          <ul className="flex flex-col items-center gap-3">
            {navigation.map((item) => {
              const isActive = active === item.key;

              return (
                <li key={item.key} className="w-full">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                    className={`group relative flex h-12 w-full items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      isActive
                        ? "bg-blue-500/20 text-white shadow-inner shadow-blue-500/10"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute -left-2 h-7 w-1 rounded-r-full bg-blue-400" />
                    )}

                    <Image
                      src={item.icon}
                      alt=""
                      width={21}
                      height={21}
                      className={`h-[21px] w-[21px] object-contain invert transition-all duration-200 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-65 group-hover:opacity-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      {/* Bottom section */}
      <section className="flex flex-col items-center gap-3">

        {/* User profile */}
        <div
          title={userName}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={38}
              height={38}
              unoptimized
              className="h-[38px] w-[38px] rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              {initials}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 h-px w-10 bg-white/10" />

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-red-500/15 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95"
        >
          <Image
            src="/sidebar/exit.png"
            alt=""
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-contain invert opacity-75"
          />
        </button>
      </section>
    </aside>
  );
};

export default Sidebarmob;
