import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./components/PostHogProvider";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${arimo.variable} antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
