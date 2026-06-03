import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconContext } from 'react-icons/lib';

export default function Sidebarbuttons(props) {
    const Location = useLocation();
    const isActive = Location.pathname === props.to;
    const btnClass = isActive ? "bg-blue-500 text-white transition-all duration-300 ease-in-out" : "text-gray-500";
    return (
        <Link to={props.to} className="shrink-0">

            <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-blue-200 hover:text-white sm:w-20 md:mx-[20px] md:my-auto md:h-[80px] md:w-[80px] md:rounded-xl ${btnClass}`}>
                <IconContext.Provider value={{size:"22px"}}>
                    {props.icon}
                    <p className='mx-auto mt-1 max-w-full truncate px-1 text-[10px] font-semibold sm:text-xs'>{props.title}</p>
                </IconContext.Provider>
            </div>
        </Link>
    )
}
