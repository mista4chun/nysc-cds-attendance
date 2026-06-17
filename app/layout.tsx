import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'NYSC CDS Attendance',
  description: 'CDS attendance management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NYSC Attend',
  },
  formatDetection: { telephone: false },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* iPhone home screen icon */}
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        {/* iPhone splash colour */}
        <meta name="theme-color" content="#006400" />
      </head>
      <body>{children}</body>
    </html>
  )
}