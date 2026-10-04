import type { Metadata, Viewport } from "next";
import { Courier_Prime, Delicious_Handrawn, Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const handwriting = Delicious_Handrawn({ weight: "400", subsets: ["latin"], variable: "--font-handwriting" });
const typewriter = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-typewriter" });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  appleWebApp: { capable: true, title: SITE_SHORT_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f7f3ea" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${handwriting.variable} ${typewriter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
