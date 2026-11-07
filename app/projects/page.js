import React from 'react'
import Sidebar from '../component/Sidebar'

const projects = () => {
  return (
     <div className='flex'>
        <Sidebar active="projects"/>
        <div className='projects h-screen w-[85vw] border'>
        projects
        </div>
    </div>
  )
}

export default projects