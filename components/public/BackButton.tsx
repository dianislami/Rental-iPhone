"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = "/",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Kembali"
      title="Kembali"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-[#E8F2FF] border border-[#D2D2D7]/80 hover:border-[#0071E3]/40 text-[#1D1D1F] hover:text-[#0071E3] shadow-2xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
    >
      <svg
        className="h-4.5 w-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
