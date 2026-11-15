import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRO-MED · Sistema NASA de Monitoreo de Salud en Misiones Espaciales",
  description:
    "Plataforma biomédica offline para monitoreo fisiológico, psicológico y conductual de astronautas frente a los 5 peligros espaciales (NASA HRP & CSA).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#070c17] text-slate-100 antialiased selection:bg-sky-500/25 selection:text-white">
        {children}
      </body>
    </html>
  );
}
