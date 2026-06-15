import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AptosProvider } from "@/components/AptosProvider";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vidora | Decentralized Video Streaming on Shelby Protocol",
  description: "A secure, decentralized video streaming platform built on top of Shelby Protocol hot storage and Aptos blockchain coordination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AptosProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AptosProvider>
      </body>
    </html>
  );
}
