import React from 'react'
import Sidebar from '../component/Sidebar'

const team = () => {
  return (
     <div className='flex'>
        <Sidebar active="team"/>
        <div className='team h-screen w-[85vw] border'>
        team
        </div>
    </div>
  )
}

export default team