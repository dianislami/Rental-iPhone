"use client";

import React, { useState } from "react";

interface IphoneVisualProps {
  model?: string;
  colorName?: string;
  colorHex?: string;
  imageUrl?: string | null;
  variant?: "hero" | "card" | "detail";
  className?: string;
}

export function IphoneVisual({
  model = "iPhone 16 Pro",
  colorName = "Natural Titanium",
  colorHex = "#9A968E",
  imageUrl = null,
  variant = "card",
  className = "",
}: IphoneVisualProps) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${model} - ${colorName}`}
          onError={() => setImgError(true)}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const lowerColor = colorName.toLowerCase();
  const isPro = model.toLowerCase().includes("pro");

  // Frame & backplate gradients matching Apple Titanium / Aluminum finishes
  let bodyStart = "#B5B0A8";
  let bodyMid = "#8F8A82";
  let bodyEnd = "#6A665F";
  let screenAccent = "#0071E3";

  if (lowerColor.includes("desert") || lowerColor.includes("gold")) {
    bodyStart = "#DECDBB";
    bodyMid = "#C2AF99";
    bodyEnd = "#9B8772";
    screenAccent = "#0071E3";
  } else if (lowerColor.includes("blue") && lowerColor.includes("titanium")) {
    bodyStart = "#68778A";
    bodyMid = "#495668";
    bodyEnd = "#2E3846";
    screenAccent = "#0071E3";
  } else if (lowerColor.includes("ultramarine") || lowerColor.includes("blue")) {
    bodyStart = "#5E7BFF";
    bodyMid = "#3A58E0";
    bodyEnd = "#1E36A8";
    screenAccent = "#38BDF8";
  } else if (lowerColor.includes("black") || lowerColor.includes("space")) {
    bodyStart = "#4C4C4E";
    bodyMid = "#2C2C2E";
    bodyEnd = "#18181A";
    screenAccent = "#0071E3";
  } else if (lowerColor.includes("white") || lowerColor.includes("silver")) {
    bodyStart = "#F7F7F5";
    bodyMid = "#E2E2DE";
    bodyEnd = "#C7C7C2";
    screenAccent = "#0071E3";
  } else if (lowerColor.includes("purple")) {
    bodyStart = "#766982";
    bodyMid = "#554961";
    bodyEnd = "#382F42";
    screenAccent = "#60A5FA";
  }

  if (variant === "hero") {
    return (
      <div
        className={`relative flex items-center justify-center select-none ${className}`}
      >
        {/* Subtle Apple Blue ambient studio glow */}
        <div
          className="absolute inset-8 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,113,227,0.38) 0%, rgba(154,150,142,0.18) 55%, transparent 80%)",
          }}
        />

        <svg
          viewBox="0 0 420 440"
          className="w-full h-full max-w-[390px] drop-shadow-[0_28px_45px_rgba(0,35,80,0.16)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroBackGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D6C7B5" />
              <stop offset="48%" stopColor="#B5A38F" />
              <stop offset="100%" stopColor="#8A7967" />
            </linearGradient>
            <linearGradient id="heroFrontMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9A968E" />
              <stop offset="50%" stopColor="#52514E" />
              <stop offset="100%" stopColor="#262628" />
            </linearGradient>
            <linearGradient id="heroScreenWallpaper" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#051329" />
              <stop offset="35%" stopColor="#003E85" />
              <stop offset="68%" stopColor="#0071E3" />
              <stop offset="100%" stopColor="#80BFFF" />
            </linearGradient>
            <linearGradient id="heroScreenWave" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#0071E3" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#030B17" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="lensGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#090D16" />
              <stop offset="100%" stopColor="#004185" />
            </linearGradient>
          </defs>

          {/* Floor studio shadow */}
          <ellipse
            cx="210"
            cy="396"
            rx="138"
            ry="14"
            fill="#00234B"
            fillOpacity="0.14"
          />

          {/* LEFT DEVICE: iPhone 16 Pro Back View (Titanium) */}
          <g transform="translate(56, 62)">
            <rect
              x="0"
              y="0"
              width="148"
              height="306"
              rx="28"
              fill="url(#heroBackGrad)"
              stroke="#E6DBD0"
              strokeWidth="2"
            />
            {/* Inner frosted glass back */}
            <rect
              x="5"
              y="5"
              width="138"
              height="296"
              rx="24"
              fill="url(#heroBackGrad)"
              stroke="#FFFFFF"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            {/* Camera bump plateau */}
            <rect
              x="14"
              y="14"
              width="74"
              height="76"
              rx="20"
              fill="#C7B6A2"
              fillOpacity="0.7"
              stroke="#EFE6DC"
              strokeWidth="1.2"
            />
            {/* 3 Pro Camera Lenses */}
            <circle
              cx="34"
              cy="34"
              r="15"
              fill="url(#lensGlass)"
              stroke="#D8C8B6"
              strokeWidth="2.5"
            />
            <circle cx="34" cy="34" r="6" fill="#0F172A" />
            <circle cx="31" cy="31" r="2.2" fill="#38BDF8" fillOpacity="0.8" />

            <circle
              cx="34"
              cy="70"
              r="15"
              fill="url(#lensGlass)"
              stroke="#D8C8B6"
              strokeWidth="2.5"
            />
            <circle cx="34" cy="70" r="6" fill="#0F172A" />
            <circle cx="31" cy="67" r="2.2" fill="#38BDF8" fillOpacity="0.8" />

            <circle
              cx="68"
              cy="52"
              r="15"
              fill="url(#lensGlass)"
              stroke="#D8C8B6"
              strokeWidth="2.5"
            />
            <circle cx="68" cy="52" r="6" fill="#0F172A" />
            <circle cx="65" cy="49" r="2.2" fill="#38BDF8" fillOpacity="0.8" />

            {/* Flash & LiDAR */}
            <circle cx="68" cy="27" r="5.5" fill="#FDE68A" fillOpacity="0.9" />
            <circle cx="68" cy="76" r="5.5" fill="#334155" />

            {/* Subtle Apple-inspired emblem in center */}
            <circle
              cx="74"
              cy="152"
              r="13"
              fill="#FFFFFF"
              fillOpacity="0.28"
            />
            <path
              d="M78 134 C78 130, 83 128, 84 128 C84 132, 80 135, 78 134 Z"
              fill="#FFFFFF"
              fillOpacity="0.35"
            />
          </g>

          {/* RIGHT DEVICE: iPhone 16 Pro Max Front/Angled Display */}
          <g transform="translate(188, 38)">
            {/* Titanium side rail depth */}
            <rect
              x="-6"
              y="3"
              width="166"
              height="332"
              rx="32"
              fill="#8D867E"
            />
            {/* Front bezel */}
            <rect
              x="0"
              y="0"
              width="166"
              height="336"
              rx="32"
              fill="url(#heroFrontMetal)"
              stroke="#D6D3CD"
              strokeWidth="1.5"
            />
            {/* OLED Screen */}
            <rect
              x="6"
              y="6"
              width="154"
              height="324"
              rx="27"
              fill="url(#heroScreenWallpaper)"
            />
            {/* iOS 18 Pro Titanium Ribbon Graphic */}
            <path
              d="M6 120 C55 85, 115 155, 160 95 L160 280 C110 310, 55 230, 6 270 Z"
              fill="url(#heroScreenWave)"
            />
            <circle
              cx="83"
              cy="175"
              r="52"
              fill="#0071E3"
              fillOpacity="0.25"
            />
            {/* Dynamic Island */}
            <rect
              x="54"
              y="15"
              width="58"
              height="16"
              rx="8"
              fill="#000000"
            />
            <circle cx="101" cy="23" r="3.5" fill="#0B2545" />
            {/* Lock screen clock */}
            <text
              x="83"
              y="78"
              textAnchor="middle"
              fill="#FFFFFF"
              fillOpacity="0.92"
              fontSize="34"
              fontWeight="700"
              fontFamily="-apple-system, SF Pro Display, sans-serif"
            >
              09:41
            </text>
            <text
              x="83"
              y="48"
              textAnchor="middle"
              fill="#E2E8F0"
              fillOpacity="0.8"
              fontSize="9"
              fontWeight="500"
              fontFamily="-apple-system, SF Pro Text, sans-serif"
            >
              Rab, 24 Nov • Banda Aceh
            </text>
            {/* Bottom home indicator */}
            <rect
              x="56"
              y="320"
              width="54"
              height="3.5"
              rx="1.75"
              fill="#FFFFFF"
              fillOpacity="0.75"
            />
          </g>
        </svg>
      </div>
    );
  }

  // Card or Detail Studio Render
  const uniqueId = `${model.replace(/\s+/g, "-")}-${colorName.replace(
    /\s+/g,
    "-"
  )}-${variant}`;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full max-h-[210px] transition-transform duration-500 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`body-${uniqueId}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor={bodyStart} />
            <stop offset="50%" stopColor={bodyMid} />
            <stop offset="100%" stopColor={bodyEnd} />
          </linearGradient>
          <linearGradient
            id={`screen-${uniqueId}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#071930" />
            <stop offset="45%" stopColor="#004494" />
            <stop offset="80%" stopColor={screenAccent} />
            <stop offset="100%" stopColor="#93C5FD" />
          </linearGradient>
        </defs>

        {/* Studio Pedestal / Shadow */}
        <ellipse
          cx="140"
          cy="214"
          rx="78"
          ry="9"
          fill="#002B5B"
          fillOpacity="0.12"
        />

        {/* Back Titanium Housing */}
        <g transform="translate(68, 18)">
          <rect
            x="0"
            y="8"
            width="88"
            height="178"
            rx="18"
            fill={`url(#body-${uniqueId})`}
            stroke="#FFFFFF"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
          {/* Camera Module */}
          <rect
            x="8"
            y="16"
            width="44"
            height="46"
            rx="12"
            fill={bodyStart}
            fillOpacity="0.65"
            stroke="#FFFFFF"
            strokeOpacity="0.45"
          />
          <circle
            cx="20"
            cy="28"
            r="8.5"
            fill="#0F172A"
            stroke={bodyStart}
            strokeWidth="1.6"
          />
          <circle
            cx="20"
            cy="49"
            r="8.5"
            fill="#0F172A"
            stroke={bodyStart}
            strokeWidth="1.6"
          />
          {isPro && (
            <circle
              cx="39"
              cy="38.5"
              r="8.5"
              fill="#0F172A"
              stroke={bodyStart}
              strokeWidth="1.6"
            />
          )}
          <circle cx="39" cy="23" r="3" fill="#FDE68A" />
        </g>

        {/* Front Display Overlapping */}
        <g transform="translate(120, 14)">
          <rect
            x="0"
            y="0"
            width="92"
            height="186"
            rx="19"
            fill="#1D1D1F"
            stroke={bodyStart}
            strokeWidth="2"
          />
          <rect
            x="4"
            y="4"
            width="84"
            height="178"
            rx="15"
            fill={`url(#screen-${uniqueId})`}
          />
          {/* Glowing abstract ribbon on screen */}
          <path
            d="M4 75 C32 52, 60 95, 88 60 L88 150 C60 170, 32 125, 4 148 Z"
            fill="#FFFFFF"
            fillOpacity="0.22"
          />
          {/* Dynamic Island */}
          <rect x="30" y="10" width="32" height="9" rx="4.5" fill="#000000" />
          {/* Clock */}
          <text
            x="46"
            y="44"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="18"
            fontWeight="700"
            fontFamily="-apple-system, SF Pro Display, sans-serif"
          >
            09:41
          </text>
          {/* Home bar */}
          <rect
            x="31"
            y="175"
            width="30"
            height="2.5"
            rx="1.25"
            fill="#FFFFFF"
            fillOpacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}
