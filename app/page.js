"use client"
import Image from "next/image";
import Navbar from "./component/Navbar";
import { useEffect } from "react";

export default function Home() {
 
  return (
    <main className="relative flex flex-col justify-between items-center gap-2"> 
      <Navbar />

      <section className=" container mx-auto mt-[15vh] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-2 px-5 py-6 lg:py-2">

      <div className="  flex flex-col gap-4">

      <h1 className="text-4xl sm:text-4xl  lg:text-5xl font-bold leading-tight  text-gray-800">Work Smarter, Not Harder. <br /> <b className="text-blue-500">Achieve Flow</b>  with TaskFlow.</h1>

      <p className="text-sm sm:text-sm  lg:text-lg font-semibold text-gray-800">Centralize tasks, track progress, and boost collaboration in one powerful, intuitive platform. Join thousands of high-performing teams.</p>

      <button type="button" className="text-white w-fit cursor-pointer active:scale-95 bg-gradient-to-br from-blue-500 to-purple-600 hover:bg-gradient-to-bl  font-medium rounded-xl text-lg px-6 py-3.5 text-center leading-5 ml-2">Start Your Free Trial</button>

      <span className="grid-cols-3 sm:grid-cols-3 gap-3 p-1 hidden lg:grid">

        <div className="rounded-lg card hover:scale-105 active:scale-95 bg-white shadow-md ">

          <span className="w-1/2 h-20 block relative  rounded-2xl overflow-hidden">
            <Image src="/card1.gif" alt="clarity" width={400} height={400} className="w-full h-full object-contain"/>
          </span>
  
          <h2 className="text-sm font-bold">COMPLETE CLARITY</h2>
          <p className="text-sm">
            Instantly visualize your task status and team progress.
          </p>
        </div>
        <div className="rounded-lg card hover:scale-105 active:scale-95 bg-white shadow-md p-2">
          <span className="w-1/2 h-20 block relative  rounded-2xl overflow-hidden">
            <Image src="/card2.gif" alt="organization" width={400} height={400} className="w-full h-full object-contain"/>
          </span>
          <h2 className="text-sm font-bold">EFFORTLESS ORGANIZATION</h2>
          <p className="text-sm">Create, assign, and prioritize tasks with ease.</p>
        </div>
        <div className="rounded-lg card hover:scale-105 active:scale-95 bg-white shadow-md p-2">
          <span className="w-1/2 h-20 block relative  rounded-2xl overflow-hidden">
            <Image src="/card3.gif" alt="collaboration" width={400} height={400} className="w-full h-full object-contain"/>
          </span>
          <h2 className="text-sm font-bold">SEAMLESS COLLABORATION</h2>
          <p className="text-sm">Real-time updates and integrated commenting.</p>
        </div>
        
      </span>
      </div>



        <div className=" ">
        <div className="h-[75%] w-full  relative">
        <Image src="/hero.png" alt="hero" width={400} height={300}  loading="eager" className="w-full object-cover h-full"/>
        </div>
        <span className="flex flex-col justify-center items-center gap-2 h-[25%] p-2">
          <span className="flex justify-center items-center gap-3 w-full">
            <div className="box h-15 w-37 relative z-10">
              <Image src="/sponserlogo1.jpg" alt="logo1"  fill className="w-full object-contain h-full"/>
            </div>
            <div className="box h-15 w-37 relative z-10">
              <Image src="/sponserlogo2.jpg" alt="logo2"  fill className="w-full object-contain h-full"/>
            </div>
            <div className="box h-15 w-37 relative z-10">
              <Image src="/sponserlogo34.jpg" alt="logo3"  fill className="w-full object-contain h-full"/>
            </div>
          </span>
          <span><p className="text-center font-semibold">
            "TaskFlow transformed our product team's productivity. <br /> its clean, powerful, and essential."
            </p></span>
        </span>
        </div>




      </section>








      <section className="flex flex-col sm:flex-row  w-[80%]   justify-center items-center gap-4    bg-slate-800 p-6 sm:p-8 rounded-t-xl">
       <span className="flex flex-col lg:flex-row justify-center items-center gap-6 bg-slate-800 h-full w-full rounded-tr-xl rounded-tl-xl">
        <h1 className="text-2xl text-center lg:text-3xl  text-white font-bold">Ready to unlock your team's potential?</h1>
         <button type="button" className="text-white cursor-pointer active:scale-95 bg-gradient-to-br from-blue-500 to-purple-600 hover:bg-gradient-to-bl  font-medium rounded-xl text-sm px-6 py-3.5 text-center leading-5">Join For Free</button>
       </span>
      </section>
    </main>
  );
}
