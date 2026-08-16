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
  description:
    "Governed AI coordination for clearer context, review, authority boundaries, and accountable delivery.",
  keywords: ["MIRRORNODE", "AI orchestration", "AI systems", "structural review"],
  authors: [{ name: "Sean Malm" }],
  openGraph: {
    title: "MIRRORNODE",
    description:
      "Governed AI coordination for clearer context, review, authority boundaries, and accountable delivery.",
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
