import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRO-MED · NASA Spaceflight Health Monitoring System",
  description:
    "Offline biomedical platform for physiological, psychological, and behavioral monitoring of astronauts across the 5 spaceflight hazards (NASA HRP & CSA).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070c17] text-slate-100 antialiased selection:bg-sky-500/25 selection:text-white">
        {children}
      </body>
    </html>
  );
}
