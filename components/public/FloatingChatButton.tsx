"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingChatButton() {
  const pathname = usePathname();

  if (pathname.startsWith("/live-chat")) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Link
        href="/live-chat"
        className="group flex items-center gap-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] pl-4 pr-5 py-3 text-white shadow-[0_10px_30px_rgba(0,113,227,0.38)] transition-all duration-300 hover:scale-[1.03] active:scale-95"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <svg
            className="h-4.5 w-4.5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#0071E3]"></span>
          </span>
        </div>
        <div className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/80 leading-none">
            Concierge 24/7
          </p>
          <p className="text-[13px] font-semibold tracking-tight leading-tight mt-0.5">
            Live Chat Anonim
          </p>
        </div>
      </Link>
    </div>
  );
}
