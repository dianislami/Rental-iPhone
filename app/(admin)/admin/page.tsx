import React from "react";
import Link from "next/link";

export default function AdminPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="apple-card max-w-md rounded-3xl p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1D1D1F]">
          Portal Admin iRent Aceh
        </h1>
        <p className="mt-2 text-sm text-[#6E6E73]">
          Folder halaman admin sudah dipisahkan di{" "}
          <code className="rounded bg-[#F5F5F7] px-1.5 py-0.5 text-xs text-[#0071E3]">
            app/(admin)/admin
          </code>
          . Saat ini fokus pengembangan berada pada sisi publik.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0071E3] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0077ED] transition-colors"
        >
          ← Kembali ke Halaman Publik
        </Link>
      </div>
    </div>
  );
}
