import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentCrow Dashboard",
  description: "Agent Teams Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 font-[family-name:var(--font-geist-sans)] min-h-screen`}
        suppressHydrationWarning
      >
        <LocaleProvider>
          <NavBar />
          <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
