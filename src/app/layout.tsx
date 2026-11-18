
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
  metadataBase: new URL("https://example.com"),
  title: {
    default: "RajRekha - Daily Results & History",
    template: "%s | RajRekha",
  },
  description:
    "RajRekha par daily published results check karein aur date-wise historical results search karein. Simple aur easy result access.",
  applicationName: "RajRekha",
  keywords: [
    "RajRekha",
    "Daily Results",
    "Result History",
    "Date Wise Results",
    "Published Results",
  ],
  openGraph: {
    title: "RajRekha - Daily Results & History",
    description:
      "Check daily published results and search historical results date-wise on RajRekha.",
    siteName: "RajRekha",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RajRekha - Daily Results & History",
    description:
      "Check daily published results and search historical results date-wise.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
