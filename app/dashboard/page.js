import React from 'react'
import Sidebar from '../component/Sidebar'
import Image from 'next/image'
import Sidebarmob from '../component/Sidebarmob'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";


const dashboard = async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <div className='flex h-screen overflow-hidden '>
            <Sidebar active="overview" />
            <Sidebarmob active="overview" />

            <div className="dashboard h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-200">

                <div className="head w-full h-auto lg:h-[20%] ">
                    <div className="hair bg-gray-100 relative w-full h-[40%] flex justify-center items-center py-2">

                        <h2 className='absolute text-slate-700 left-5 lg:block hidden'>
                            Workspace / <b>Overview</b>
                        </h2>
                        <Image src="/dashboard/plus.png" alt="NewTask" width={20} height={10} className='left-4 lg:hidden absolute' />
                        <div className="search flex justify-center items-center gap-5">
                            <input type="text" placeholder='Workspace / Overview' className='w-[85%] px-5 py-2 bg-slate-300 rounded-lg outline-none lg:hidden border-slate-700 focus:border-blue-500' />

                            <input type="text" placeholder='Search' className='px-5 py-2 bg-slate-300 rounded-lg hidden lg:block outline-none  border-slate-700 focus:border-blue-500' />

                            <button type="button" className="text-white cursor-pointer active:scale-95 bg-linear-to-br from-blue-500 to-purple-600 hover:bg-linear-to-bl  font-medium rounded-xl text-sm px-4 py-2.5 text-center leading-5 hidden lg:flex gap-2"> <Image src="/dashboard/plus.png" alt="NewTask" width={20} height={10} className='invert' />New task</button>


                        </div>
                        <Image src="/dashboard/alarm.gif" alt="notification" width={30} height={10} className='absolute right-3 lg:right-5 mix-blend-multiply' />
                    </div>



                    <div className="face w-full h-[60%]  p-3">
                        <h1 className='text-2xl lg:text-3xl font-medium text-slate-800'>Welcome, {session.user.name} 👋</h1>
                        <p className=' text-sm text-slate-500'>Here's what's happening with your team today</p>
                    </div>

                </div>





                <div className="body h-auto lg:h-[80%] flex lg:flex-row flex-col gap-10 overflow-x-hidden overflow-y-auto scrollbar-hide">


                    <div className="left h-auto  w-full lg:w-[70%] gap-2 flex flex-col items-center overflow-x-hidden overflow-y-auto scrollbar-hide">

                        <div className="head w-full lg:h-[27%] h-fit lg:p-5  lg:flex lg:gap-5 grid grid-cols-2 gap-3 p-3">

                            <div className="card relative h-full lg:lg:w-1/4 bg-white shadow-md rounded-lg p-3">
                                <h3 className='text-sm lg:text-xl'>Total tasks</h3>
                                <h1 className='text-4xl font-medium'>48</h1>
                                <Image src="/dashboard/cards/file.gif" alt="tasks" width={30} height={10} className='absolute top-5 mix-blend-multiply right-5' />
                                <p className='flex items-center gap-1'> <b className='text-green-400'>+12%</b> this week</p>
                            </div>


                            <div className="card relative h-full lg:w-1/4 bg-white shadow-md rounded-lg p-3">
                                <h3 className='text-sm lg:text-xl'>In progress</h3>
                                <h1 className='text-4xl font-medium'>12</h1>
                                <Image src="/dashboard/cards/evolution.gif" alt="tasks" width={30} height={10} className='absolute top-5 mix-blend-multiply right-5' />
                            </div>

                            <div className="card relative h-full lg:w-1/4 bg-white shadow-md rounded-lg p-3">
                                <h3 className='text-sm lg:text-xl'>Completed</h3>
                                <h1 className='text-4xl font-medium'>28</h1>
                                <Image src="/dashboard/cards/check.gif" alt="tasks" width={30} height={10} className='absolute top-5 mix-blend-multiply right-5' />
                                <p className='flex items-center gap-1'>Completion rate <b className='text-green-400'>58%</b></p>
                            </div>

                            <div className="card relative h-full lg:w-1/4 bg-white shadow-md rounded-lg p-3">
                                <h3 className='text-sm lg:text-xl'>Overdue</h3>
                                <h1 className='text-4xl font-medium'>3</h1>
                                <Image src="/dashboard/cards/danger.gif" alt="tasks" width={30} height={10} className='absolute top-5 mix-blend-multiply right-5' />
                                <p className='flex items-center gap-1'>Needs attention</p>
                            </div>

                        </div>



                        <div className="body w-full h-fit lg:h-[70%] flex lg:flex-row flex-col justify-between items-center px-3 lg:px-5 py-1 gap-20 lg:gap-3 ">

                            <div className="left w-full lg:w-[65%] h-fit lg:h-full ">

                                <div className="head flex flex-col lg:flex-row justify-between py-4 px-2 lg:items-center gap-3 bg-white rounded-t-md">

                                    <span>

                                        <h2 className='text-lg font-bold'>My tasks</h2>
                                        <p className='text-xs'>Keep track of your work</p>

                                    </span>
                                    <div className="taskfilter bg-white border border-slate-400 rounded-md w-fit h-fit" >
                                        <button className=' p-1 lg:p-2 text-sm rounded-md cursor-pointer' >All Tasks</button>
                                        <button className='bg-gray-300 p-1 lg:p-2 text-sm rounded-md cursor-pointer' >In progress</button>
                                        <button className=' p-1 lg:p-2 text-sm rounded-md cursor-pointer' >Completed</button>
                                        <button className=' p-1 lg:p-2 text-sm rounded-md cursor-pointer' >Overdue</button>
                                    </div>
                                </div>
                                <div className="allselect flex py-1 px-3 items-center bg-gray-300">
                                    <span className='flex gap-2 w-1/3 items-center'>
                                        <input type="checkbox" name="allselect" id="allselect" />
                                        <label htmlFor="allselect">Tasks</label>
                                    </span>
                                    <span className='w-1/3 px-3'>Projects</span>
                                    <span className='w-1/3 px-3'>Due</span>
                                </div>
                                <div className="taskcards  flex flex-col gap-1 justify-between items-center ">

                                    <span className='taskcard  flex py-2 px-3 gap-2 items-center w-full bg-white'>

                                        <span className='flex gap-2 items-center overflow-hidden w-1/3 '>
                                            <input type="checkbox" name="oneselect" />
                                            <label htmlFor="oneselect" className=' whitespace-nowrap font-medium' >Refractior user profile</label>
                                        </span>

                                        <span className='overflow-hidden pl-3 font-medium w-1/3'>Fictiouus Tasks</span>

                                        <span className='overflow-hidden pl-3 font-medium w-1/3'>  20 dyas</span>
                                    </span>

                                </div>


                            </div>

                            <div className="right w-full lg:w-[35%]  h-full flex flex-col gap-2 ">
                                <div className="youractivity h-1/2 w-full rounded-md bg-white shadow-md lg:p-1 p-2 overflow-hidden">
                                    <h3 className='text-slate-800 text-lg font-medium ml-2'>
                                        Your activity
                                    </h3>

                                    <div className='p-2 flex flex-col gap-1 overflow-x-hidden overflow-y-auto h-[80%] scrollbar-hide'>
                                        <span className='ml-1.5 text-sm w-full font-medium'>
                                            <p> <b>You.</b> Completed : <b>design create</b> <br /> <b className='font-medium text-slate-600'>- 38 min</b> </p>
                                        </span>


                                    </div>
                                </div>
                                <div className="upcomingdeadliunes h-1/2 w-full rounded-md bg-white shadow-md lg:p-1 p-2">
                                    <h3 className='text-slate-800 text-lg font-medium ml-2'>
                                        Upcoming Deadlines
                                    </h3>
                                    <div className='p-2 flex flex-col gap-1 overflow-x-hidden overflow-y-auto h-[80%] scrollbar-hide'>

                                        <span className=' text-sm w-full font-medium px-5 py-2 border-b-1 border-slate-400'>
                                            <p className="flex gap-1 items-center justify-between">
                                                <span className='flex gap-2 items-center'>
                                                    <Image src="/dashboard/calendar.png" alt="time" width={15} height={10} className='' />
                                                    <b className='font-medium'>Homepage Design ---</b>
                                                </span>
                                                <b className='font-medium text-slate-600'>Today</b> </p>
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>


                    </div>


                    <div className="right h-full lg:w-[30%] w-full p-3 ">
                        <div className=' overflow-hidden rounded-md h-full p-3 bg-white shadow-xl'>
                            <h2 className='text-slate-800 text-lg font-medium ml-2'> Team Activity</h2>
                            <div className='p-2 flex flex-col gap-1 overflow-x-hidden overflow-y-auto h-[80%] scrollbar-hide'>

                                <span className='ml-1.5 text-sm w-full font-medium flex gap-2'>
                                    <Image src="/profile.jpg" alt="profile" width={40} height={40} className='rounded-full object-contain' />
                                    <span className='w-full'>
                                        <p> <b>Riya.</b> Completed : <b>design create</b> <br /> <b className='font-medium text-slate-600'>- 38 min</b> </p>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default dashboard