import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noir-casefile.vercel.app";

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Noir Casefile — AI Murder Mystery",
    template: "%s | Noir Casefile",
  },
  description:
    "A procedurally generated AI murder mystery game. Interrogate suspects, examine clues, detect flawed alibis, and bring the killer to justice.",
  applicationName: "Noir Casefile",
  keywords: [
    "murder mystery game",
    "noir game",
    "ai detective game",
    "detective game",
    "interactive mystery",
    "whodunnit",
    "procedural game",
    "alibi investigation",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Noir Casefile — AI Murder Mystery",
    description:
      "Every case generates a unique crime scene, clues, and suspects with full alibis. Exactly one suspect is the killer. Interrogate them and bring formal charges.",
    siteName: "Noir Casefile",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Noir Casefile - Procedural AI Murder Mystery Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noir Casefile — AI Murder Mystery",
    description:
      "Solve the murder. Find the crack in the alibi. Interrogate suspects and name the killer before your question budget expires.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
