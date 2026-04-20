import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberTracker Pro",
  description: "Sistema de gestión y fidelización para barberías",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
