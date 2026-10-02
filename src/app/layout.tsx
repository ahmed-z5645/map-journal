import type { Metadata, Viewport } from "next";
import { Caveat, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Toronto Postcards",
  description: "A personal journal of postcards pinned around Toronto.",
  appleWebApp: { capable: true, title: "Postcards", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f7f3ea" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
