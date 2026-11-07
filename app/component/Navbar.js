"use client"

import { useRouter } from "next/navigation";
import React, { useState } from 'react'
import Image from 'next/image'
const Navbar = () => {
    const [menudisplay, setMenudisplay] = useState(false)
      const router = useRouter();
  return (
    <header className="w-full flex justify-center items-center">
        <nav className="flex lg:hidden items-center justify-center p-3 bg-white text-slate-800 top-5 w-full shadow-lg rounded-lg absolute z-20">


            <button onClick={() => setMenudisplay(!menudisplay)} className='hamburhger absolute left-7 h-5 w-5'>
                <Image src="/menu.png" alt="menu" width={400} height={300}  loading="eager" className={`w-full object-contain h-full transition-transform duration-200 ease-in-out ${menudisplay ? "rotate-90" : "rotate-0"} `}/>
            </button>
            {menudisplay && <ul className="flex flex-col items-center gap-5 absolute left-3 top-full mt-2 py-3 px-2 bg-white rounded-lg z-20">
                <li onClick={() => router.push("/dashboard")} className="text-xl font-[500] w-full flex justify-center items-center active:text-blue-500 rounded-lg shadow active:scale-90 px-2 py-1 bg-gray-100" >Home</li>
                <li className="text-xl font-[500] w-full flex justify-center items-center active:text-blue-500 rounded-lg shadow active:scale-90 px-2 py-1 bg-gray-100" >Features</li>
                <li className="text-xl font-[500] w-full flex justify-center items-center active:text-blue-500 rounded-lg shadow active:scale-90 px-2 py-1 bg-gray-100" >Pricing</li>
                <li className="text-xl font-[500] w-full flex justify-center items-center active:text-blue-500 rounded-lg shadow active:scale-90 px-2 py-1 bg-gray-100" >Contact</li>
            </ul>}
             


             <span  className="flex items-center gap-2 cursor-default">
            <Image src="/logo.png" alt="Logo" width={50} height={50}  />
            <h1 className="text-2xl font-bold">TaskFlow</h1>
        </span>
        <span className='absolute right-5 '>
            <button  type="button" className="text-white cursor-pointer active:scale-95 bg-gradient-to-br from-blue-500 to-purple-600 hover:bg-gradient-to-bl  font-medium rounded-xl text-sm px-4 py-2.5 text-center leading-5">Go</button>

        </span>
        </nav>


        





    <nav className=" hidden lg:flex items-center justify-around p-3 bg-white text-slate-800 top-5 w-full shadow-lg rounded-lg absolute z-20">
        <span className="flex items-center gap-2 cursor-default">
            <Image src="/logo.png" alt="Logo" width={50} height={50}  />
            <h1 className="text-2xl font-bold">TaskFlow</h1>
        </span>
        <span>
            <ul className="flex items-center gap-10">
                <li onClick={() => router.push("/dashboard")} className="hover:text-blue-500 cursor-pointer text-xl font-[500]">Home</li>
                <li className="hover:text-blue-500 cursor-pointer text-xl font-[500]">Features</li>
                <li className="hover:text-blue-500 cursor-pointer text-xl font-[500]">Pricing</li>
                <li className="hover:text-blue-500 cursor-pointer text-xl font-[500]">Contact</li>
            </ul>
        </span>
        <span>
            <button type="button" className="text-white cursor-pointer active:scale-95 bg-gradient-to-br from-blue-500 to-purple-600 hover:bg-gradient-to-bl  font-medium rounded-xl text-sm px-4 py-2.5 text-center leading-5">Get Started - Free</button>

        </span>
    </nav>
    </header>
  )
}

export default Navbar