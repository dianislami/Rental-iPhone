"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/Icons";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/katalog", label: "Katalog" },
    { href: "/tentang-kami", label: "Tentang Kami & FAQ" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-[#D2D2D7]/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="iRent Logo"
            className="h-8 w-8 rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            iRent
          </span>
        </Link>

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 text-[13px] transition-colors duration-200 ${
                  active
                    ? "font-semibold text-[#0071E3]"
                    : "font-medium text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://wa.me/6281168908888?text=Halo%20iRent%20Concierge%20Aceh%2C%20saya%20ingin%20bertanya%20ketersediaan%20unit%20iPhone."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#E8F2FF] hover:bg-[#0071E3] border border-[#0071E3]/25 px-3.5 py-1.5 text-[12px] font-semibold text-[#0071E3] hover:text-white transition-all duration-200"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            <span>Hubungi WhatsApp</span>
          </a>


          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F]"
            aria-label="Toggle Menu"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D2D2D7]/60 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] ${
                  active
                    ? "bg-[#E8F2FF] font-semibold text-[#0071E3]"
                    : "font-medium text-[#1D1D1F] hover:bg-[#F5F5F7]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.label}
                </span>
                <span className="text-xs text-[#86868B]">→</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <a
              href="https://wa.me/6281168908888"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071E3] py-2.5 text-[13px] font-medium text-white"
            >
              <WhatsAppIcon className="h-4 w-4 text-white" />
              <span>Hubungi WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
