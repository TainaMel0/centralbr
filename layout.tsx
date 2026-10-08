import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Certificados",
  description: "Portal de certificados de calibração da Central Brasil Instrumentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
