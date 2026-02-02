import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indian Independent Journalists Network (IIJN)",
  description: "Platform-Independent Journalism Association - Empowering independent journalists with verified profiles, case management, and direct public engagement.",
  keywords: ["IIJN", "Journalism", "Independent Media", "Press Freedom", "Indian Journalists", "Verified Journalism", "Case-Based Reporting"],
  authors: [{ name: "IIJN Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Indian Independent Journalists Network (IIJN)",
    description: "Empowering independent journalists with platform-independent infrastructure and verified reporting",
    url: "https://iijn.org",
    siteName: "IIJN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indian Independent Journalists Network (IIJN)",
    description: "Platform-Independent Journalism Association for verified reporters",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
