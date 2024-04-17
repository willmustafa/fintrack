import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/assets/styles/globals.scss";
import { Montserrat } from "next/font/google";

const font = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinTrack",
  description: "Controle financeiro de forma fácil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={font.className}>{children}</body>
    </html>
  );
}
