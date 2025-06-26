import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner"
import { ConditionalSidebarLayout } from "@/components/ConditionalSidebarLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta - Generate change logs in one click",
  description: "Delta helps developers automatically generate beautiful change logs for their repositories with a single click.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthSessionProvider>
          <ConditionalSidebarLayout>
            {children}
          </ConditionalSidebarLayout>
        </NextAuthSessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
