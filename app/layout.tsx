import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Arbidex - DEX Aggregator on Base",
  description: "Find the best swap rates across Uniswap V3, PancakeSwap V3, and Aerodrome on Base network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
