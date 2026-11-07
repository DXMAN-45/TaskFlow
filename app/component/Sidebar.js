"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Sidebar = ({ active }) => {
    const router = useRouter();
    const { data: session } = useSession();

    const handleSignOut = async () => {
        await signOut({
            callbackUrl: "/login",
        });
    };

    return (

        <>


            <div className='h-screen w-[15vw] border bg-slate-900 p-2 lg:flex flex-col justify-between hidden'>
                <section>

                    <div className="logo pt-2">
                        <span onClick={() => router.push("/")} className="flex items-center gap-2 cursor-default">
                            <Image src="/logo.png" alt="Logo" width={50} height={50} />
                            <h1 className="text-2xl text-slate-200 font-bold">TaskFlow</h1>
                        </span>
                    </div>



                    <div className="sidelists w-full flex flex-col mt-5">
                        <ul className='flex flex-col justify-center items-center gap-3'>
                            <span onClick={() => router.push("/dashboard")} className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "overview" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                                <Image src="/sidebar/overview.png" alt="overview" width={20} height={20} className='invert' />Overview
                            </span>


                            <span onClick={() => router.push("/tasks")} className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "tasks" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                                <Image src="/sidebar/tasks.png" alt="tasks" width={20} height={20} className='invert' />My tasks
                            </span>



                            <span onClick={() => router.push("/team")} className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "team" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                                <Image src="/sidebar/teams.png" alt="teams" width={20} height={20} className='invert' />Team
                            </span>



                            <span onClick={() => router.push("/projects")} className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "projects" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                                <Image src="/sidebar/projects.png" alt="projects" width={20} height={20} className='invert' />Projects
                            </span>






                        </ul>
                    </div>


                </section>



                <section>


                    <div className="profile flex p-1 justify-between items-center my-4">
                        <div className="profilepic flex gap-2 cursor-default">
                            {session?.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                                    {(session?.user?.name || "User")
                                        .trim()
                                        .split(/\s+/)
                                        .map((word) => word[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                            )}
                        <div className="profilename relative min-w-0 flex-1 text-slate-100 text-sm group">
    <h3 className="truncate whitespace-nowrap cursor-default w-3/4">
        {session?.user?.name || "User"}
    </h3>

    <p className="text-xs truncate whitespace-nowrap cursor-default w-3/4">TaskFlow Member</p>

    <div
        className="absolute left-0 bottom-full mb-2
        invisible opacity-0 group-hover:visible group-hover:opacity-100
        transition-opacity duration-200
        bg-slate-800 text-white text-xs rounded-md
        px-3 py-2 shadow-lg whitespace-normal break-words
        w-max max-w-56 z-50 pointer-events-none"
    >
        {session?.user?.name || "User"}
        <div className="text-xs">TaskFlow Member</div>
    </div>
</div>

                        </div>
                        <div className="profilesetting cursor-pointer">
                            <Image src="/sidebar/setting.png" alt="setting" width={25} height={25} className='invert' />
                        </div>
                    </div>



                    <div className="exit border-t-2 border-slate-500 py-2 flex justify-end">
                        <span className='h-full w-[10%] '>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                title="Sign out"
                                aria-label="Sign out"
                                className="cursor-pointer"
                            >
                                <Image
                                    src="/sidebar/exit.png"
                                    alt="Sign out"
                                    width={15}
                                    height={15}
                                    className="invert"
                                />
                            </button> </span>
                    </div>



                </section>






            </div>

        </>

    )
}

export default Sidebar