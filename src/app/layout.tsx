import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import QueryProvider from "@/components/providers/QueryProvider";

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
  viewportFit: "cover",
  themeColor: "#f8f7ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-screen w-full flex-col overflow-x-hidden">
        <SiteHeader />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
