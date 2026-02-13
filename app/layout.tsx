import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./components/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PagePass - Share Books with Your Circle",
  description: "PagePass is where book lovers share their personal libraries. Join trusted circles, borrow books from friends, and pass books along without returning them to the owner. Goodreads meets Letterboxd for physical book lending.",
  keywords: ["book sharing", "book lending", "reading circles", "book clubs", "physical books", "book exchange"],
  authors: [{ name: "PagePass" }],
  openGraph: {
    title: "PagePass - Share Books with Your Circle",
    description: "Join trusted circles and share physical books with friends. Chain lending made easy.",
    url: "https://pagepass.app",
    siteName: "PagePass",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PagePass - Share Books with Your Circle",
    description: "Join trusted circles and share physical books with friends.",
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
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
