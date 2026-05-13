import type { Metadata } from "next";
import "@fontsource-variable/inter";
import { getClubConfig } from "@/lib/club-config";
import { getClubThemeStyle } from "@/lib/club-branding";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Padel MVP",
  description: "MVP de reservas para un club de padel"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clubConfig = await getClubConfig();

  return (
    <html lang="es">
      <body className="antialiased" style={getClubThemeStyle(clubConfig.colors)}>
        {children}
      </body>
    </html>
  );
}
