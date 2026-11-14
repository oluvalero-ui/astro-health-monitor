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
      <body className="min-h-screen bg-[#f4f7fc] text-slate-900 antialiased selection:bg-blue-600/15 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
