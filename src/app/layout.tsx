import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

import InstallPrompt from "@/components/ui/pwa-install-button";
import { Toaster } from "sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiffinz",
  description: "Your daily meal companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased bg-background`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          duration={30000}
          richColors
        />
        <InstallPrompt />
      </body>
    </html>
  );
}
