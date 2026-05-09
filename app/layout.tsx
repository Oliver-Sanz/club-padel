import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Padel MVP",
  description: "MVP de reservas para un club de padel"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
