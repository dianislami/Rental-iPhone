"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollAnimator() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const observedElements = new WeakSet<Element>();
    const animationMap = new WeakMap<Element, Animation>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const anim = animationMap.get(entry.target);
            if (anim) {
              anim.play();
            }
            io.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -32px 0px",
      }
    );

    function registerElements() {
      const main = document.querySelector("main");
      if (!main) return;

      const targets = main.querySelectorAll(
        "section > div, .apple-card, .apple-deep-blue-banner, [data-reveal]"
      );

      targets.forEach((el) => {
        if (observedElements.has(el)) return;
        if (el.classList.contains("animate-pulse")) return;
        if (typeof el.animate !== "function") return;

        observedElements.add(el);

        // Compute subtle stagger delay for cards inside a grid
        let staggerMs = 0;
        const parent = el.parentElement;
        if (parent && parent.classList.contains("grid")) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(el);
          if (index >= 0) {
            staggerMs = (index % 4) * 75;
          }
        }

        const anim = el.animate(
          [
            {
              opacity: 0,
              transform: "translate3d(0, 26px, 0) scale(0.985)",
            },
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
            },
          ],
          {
            duration: 660,
            delay: staggerMs,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
          }
        );

        const rect = el.getBoundingClientRect();
        const isInInitialViewport =
          rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

        if (isInInitialViewport) {
          anim.play();
        } else {
          anim.pause();
          animationMap.set(el, anim);
          io.observe(el);
        }
      });
    }

    // Run after hydration frame completes
    const timerId = window.setTimeout(() => {
      registerElements();
    }, 30);

    const mainEl = document.querySelector("main");
    const mo = new MutationObserver(() => {
      registerElements();
    });

    if (mainEl) {
      mo.observe(mainEl, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.clearTimeout(timerId);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
