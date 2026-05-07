import React from 'react'

export default function Screencontainer({children}) {
  return (
    <div className="w-[calc(100%-100px)] h-screen bg-[#1E2A3E] rounded-xl">
        {children}
    </div>
  )
}
