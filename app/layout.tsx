import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iRent Aceh",
  description:
    "Sewa iPhone seri terbaru untuk konten, liburan, atau event. Baterai 90%+, perlindungan AppleCare+ Shield, dan serah terima instan di 4 cabang resmi Aceh.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/sf-pro-display"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#1D1D1F] selection:bg-[#0071E3]/15 selection:text-[#0071E3]">
        {children}
      </body>
    </html>
  );
}
