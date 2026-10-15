import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Brasil | Portal de Certificados",
  description: "Consulte certificados de calibração e acompanhe o histórico dos seus equipamentos.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
