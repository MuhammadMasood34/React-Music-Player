import React from 'react'

export default function Screencontainer({children}) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[#1E2A3E] md:rounded-xl">
        {children}
    </div>
  )
}
