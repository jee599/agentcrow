import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpoonCompose Dashboard",
  description: "Agent Teams Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100 min-h-screen`}
        suppressHydrationWarning
      >
        <nav className="border-b border-gray-800 px-6 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">SpoonCompose</h1>
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              Dashboard
            </Link>
            <Link
              href="/agents"
              className="text-sm text-gray-400 hover:text-white"
            >
              Agents
            </Link>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
