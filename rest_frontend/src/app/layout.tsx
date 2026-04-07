import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/lib/QueryProvider";

export const metadata: Metadata = {
  title: "Software Restaurante",
  description: "Software para el manejo de un restaurante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {/* Envolvemos la app con nuestro Provider modular */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}