import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>FinTrack</title>
      </head>
      <body
        className={clsx("min-h-screen bg-background font-sans antialiased")}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col h-screen">
            <main>{children}</main>
            <footer className="w-full flex items-center justify-center py-3 absolute bottom-0">
              <Link
                isExternal
                className="flex items-center gap-1 text-current"
                href="https://willmustafa.github.io/"
                title="Willian Mustafa page"
              >
                <span className="text-default-600">
                  Criado por Willian Mustafa - Acesse meu Github e me pague um
                  café!
                </span>
              </Link>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
