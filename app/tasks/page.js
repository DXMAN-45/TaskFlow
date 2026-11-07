import React from 'react'
import Sidebar from '../component/Sidebar'

const tasks = () => {
  return (
       <div className='flex'>
        <Sidebar active="tasks"/>
        <div className='tasks h-screen w-[85vw] border'>
        tasks
        </div>
    </div>
  )
}

export default tasks