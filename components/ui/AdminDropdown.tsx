"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/ui/Icons";

export interface AdminDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface AdminDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminDropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  variant?: "pill" | "field" | "compact";
  align?: "left" | "right";
  className?: string;
}

export function AdminDropdown({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  icon,
  variant = "field",
  align = "left",
  className = "",
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);

  const triggerBaseClass =
    variant === "pill"
      ? `inline-flex items-center justify-between gap-3.5 rounded-full px-4 py-2.5 text-[12px] font-semibold transition-all cursor-pointer select-none ${
          open
            ? "bg-white text-[#0071E3] border border-[#0071E3] ring-3 ring-[#0071E3]/12 shadow-xs"
            : "bg-[#F5F5F7] hover:bg-white text-[#1D1D1F] border border-[#D2D2D7]/70 hover:border-[#0071E3]/50 shadow-2xs"
        }`
      : variant === "compact"
      ? `inline-flex items-center justify-between gap-2.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer select-none ${
          open
            ? "bg-[#0071E3] text-white border border-[#0071E3] shadow-xs"
            : "bg-[#E8F2FF] hover:bg-[#0071E3] text-[#0071E3] hover:text-white border border-[#0071E3]/20"
        }`
      : `flex w-full items-center justify-between gap-3.5 rounded-2xl px-4 py-3 text-[13px] font-medium transition-all cursor-pointer select-none ${
          open
            ? "bg-white text-[#1D1D1F] border border-[#0071E3] ring-3 ring-[#0071E3]/12 shadow-xs"
            : "bg-[#F5F5F7] hover:bg-[#EFEFF4] text-[#1D1D1F] border border-transparent hover:border-[#D2D2D7]/80"
        }`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={triggerBaseClass}
      >
        <span className="inline-flex items-center gap-2 min-w-0 truncate">
          {icon && (
            <span
              className={`shrink-0 ${
                variant === "compact" && open
                  ? "text-white"
                  : "text-[#0071E3]"
              }`}
            >
              {icon}
            </span>
          )}
          <span
            className={`truncate ${
              !selectedOption && variant === "field"
                ? "text-[#86868B]"
                : ""
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <svg
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${
            variant === "compact"
              ? open
                ? "text-white"
                : "text-[#0071E3]"
              : open
              ? "text-[#0071E3]"
              : "text-[#6E6E73]"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 min-w-[220px] ${
            variant === "field" ? "w-full" : "w-max max-w-xs"
          } ${
            align === "right" ? "right-0" : "left-0"
          } rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-[#D2D2D7]/80`}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-[12px] text-[#86868B] text-center">
                Tidak ada pilihan tersedia
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-[12.5px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[#0071E3] text-white font-semibold shadow-2xs"
                        : "text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3] font-medium"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{opt.label}</p>
                      {opt.sublabel && (
                        <p
                          className={`text-[10.5px] truncate mt-0.5 ${
                            isSelected ? "text-white/80" : "text-[#86868B]"
                          }`}
                        >
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
