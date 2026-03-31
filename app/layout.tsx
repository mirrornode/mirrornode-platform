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

export const metadata: Metadata = {
  title: "MIRRORNODE",
  description: "Distributed AI orchestration lattice — coordinating Lucian, Osiris, Hermes, Thoth, Theia, and Ptah across quantum-cognitive bridges.",
  keywords: ["MIRRORNODE", "AI orchestration", "distributed systems", "agents"],
  authors: [{ name: "Sean Malm" }],
  openGraph: {
    title: "MIRRORNODE",
    description: "Distributed AI orchestration lattice",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
