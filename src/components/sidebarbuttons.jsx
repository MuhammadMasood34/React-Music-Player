import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconContext } from 'react-icons/lib';

export default function Sidebarbuttons(props) {
    const Location = useLocation();
    const isActive = Location.pathname === props.to;
    const btnClass = isActive ? "btn-body bg-blue-500 text-white transition-all duration-300 ease-in-out" : "btn-body text-gray-500";
    return (
        <Link to={props.to}>

            <div className={`h-[80px] w-[80px] rounded-xl  bg-blue-200 flex items-center justify-center flex-col my-auto mx-[20px] hover:text-white ${btnClass}`}>
                <IconContext.Provider value={{size:"24px"}}>
                    {props.icon}
                    <p className='font-semibold mx-auto my-[4px] text-xs'>{props.title}</p>
                </IconContext.Provider>
            </div>
        </Link>
    )
}
