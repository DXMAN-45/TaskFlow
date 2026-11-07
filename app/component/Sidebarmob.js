
"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import React from 'react'
import Image from 'next/image'


const Sidebarmob = ({ active }) => {
    const router = useRouter();
    const { data: session } = useSession();

    const handleSignOut = async () => {
        await signOut({
            callbackUrl: "/login",
        });
    };

    return (
        <div className='h-screen w-fit border bg-slate-900 p-2 flex flex-col justify-between lg:hidden'>
            <section>

                <div className="logo pt-2">
                    <span className="flex items-center gap-2 cursor-default">
                        <Image src="/logo.png" alt="Logo" width={50} height={50} />
                    </span>
                </div>



                <div className="sidelists w-full flex flex-col mt-5">
                    <ul className='flex flex-col justify-center items-center gap-3'>

                        <span className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "overview" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                            <Image src="/sidebar/overview.png" alt="overview" width={20} height={20} className='invert' />
                        </span>


                        <span className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "tasks" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                            <Image src="/sidebar/tasks.png" alt="tasks" width={20} height={20} className='invert' />
                        </span>


                        <span className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "team" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                            <Image src="/sidebar/teams.png" alt="teams" width={20} height={20} className='invert' />
                        </span>


                        <span className={`text-slate-200 text-lg flex items-center w-full pl-3 py-1 ${active === "projects" ? "bg-slate-800" : ""} rounded-lg gap-3 cursor-pointer active:scale-95`}>
                            <Image src="/sidebar/projects.png" alt="projects" width={20} height={20} className='invert' />
                        </span>

                    </ul>
                </div>


            </section>


            <section>


                <div className="profile flex flex-col gap-5 p-1 justify-between items-center my-4">
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

                    </div>
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
                    </button>
                </div>


            </section>




        </div>
    )
}

export default Sidebarmob