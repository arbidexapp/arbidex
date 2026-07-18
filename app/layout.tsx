import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aggrex - DEX Aggregator on Base",
  description: "Find the best swap rates across Uniswap V3, PancakeSwap V3, and Aerodrome on Base network",
  metadataBase: new URL('https://aggrex.vercel.app'),
  icons: {
    icon: '/aggrex-logo.png',
    apple: '/aggrex-logo.png',
  },
  openGraph: {
    title: 'Aggrex - DEX Aggregator on Base',
    description: 'Find the best swap rates across Uniswap V3, PancakeSwap V3, and Aerodrome on Base.',
    url: 'https://aggrex.vercel.app',
    siteName: 'Aggrex',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="base:app_id" content="6a5b3c0878da0c9886635afc" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
