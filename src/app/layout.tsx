import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import QueryProvider from "@/components/providers/QueryProvider";
import ThemeSync from "@/components/providers/ThemeSync";

export const metadata: Metadata = {
  title: "Vaultly",
  description: "Your secure document vault",
  icons: {
    icon: "/brand/vaultly-logo-unlocked.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-screen w-full flex-col overflow-x-hidden">
        <ThemeSync />
        <SiteHeader />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
