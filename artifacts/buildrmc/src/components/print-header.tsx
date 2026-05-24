import React from "react";

export function PrintHeader() {
  return (
    <div className="w-full flex flex-col font-sans mb-6 select-none">
      {/* Decorative top gradient bar */}
      <div className="flex h-1.5 w-full shrink-0">
        <div className="w-[40%] bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#db2777]" />
        <div className="w-[30%] bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]" />
        <div className="w-[30%] bg-gradient-to-r from-[#f97316] to-[#ef4444]" />
      </div>

      {/* Main header block */}
      <div className="bg-[#131522] p-4 flex items-center gap-5 w-full shrink-0">
        {/* Logo box */}
        <div className="bg-black w-[72px] h-[72px] p-2 flex items-center justify-center shrink-0 border border-slate-800">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="60%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            {/* Left stroke of A */}
            <path d="M 18 80 L 46 20 L 56 20 L 28 80 Z" fill="url(#aGrad)" />
            {/* Right stroke of A / vertical stem of E */}
            <path d="M 46 20 L 56 20 L 36 80 L 26 80 Z" fill="url(#eGrad)" />
            {/* E's top bar */}
            <path d="M 51 20 L 82 20 L 78 30 L 48 30 Z" fill="url(#eGrad)" />
            {/* E's middle bar */}
            <path d="M 41 47 L 76 47 L 72 57 L 38 57 Z" fill="url(#eGrad)" />
            {/* E's bottom bar */}
            <path d="M 31 70 L 82 70 L 78 80 L 27 80 Z" fill="url(#eGrad)" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h1 className="text-[25px] font-black tracking-wide text-white uppercase leading-none font-sans">
            FORTUNE CONCRETE
          </h1>
          <p className="text-[11px] font-semibold text-[#f97316] tracking-wider mt-1.5 font-sans">
            Building Trust &bull; Delivering Excellence
          </p>
          <div className="w-full h-[1px] bg-slate-700/60 my-2" />
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] text-slate-300 font-bold font-sans">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#f97316] shrink-0" />
              Kompally, Hyderabad, Telangana
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#f97316] shrink-0" />
              9010514880
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#f97316] shrink-0" />
              abcs3d@gmail.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
