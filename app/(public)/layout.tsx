import React, { Suspense } from "react";
import { Navbar } from "@/components/public/Navbar";
import { FloatingChatButton } from "@/components/public/FloatingChatButton";
import { ScrollAnimator } from "@/components/public/ScrollAnimator";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1F]">
      <Suspense
        fallback={
          <div className="sticky top-0 z-50 h-14 w-full apple-glass border-b border-[#D2D2D7]/60" />
        }
      >
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <ScrollAnimator />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingChatButton />
      </Suspense>
    </div>
  );
}
