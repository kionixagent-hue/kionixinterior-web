import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import FloatingWA from "@/components/FloatingWA";
import WaLeadModal from "@/components/WaLeadModal";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const title = "Kionix Interior — Batam";
const description = "Spesialis interior rumah, kantor, apartemen & hotel di Batam";
const ogImage = "/images/portfolio/kitchen-set.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://kionixinterior.com"),
  title,
  description,
  keywords: [
    "jasa interior batam",
    "desain interior batam",
    "kontraktor interior batam",
    "interior rumah batam",
    "interior kantor batam",
    "interior apartemen batam",
    "interior hotel batam",
    "kitchen set batam",
    "lemari custom batam",
    "kionix interior",
  ],
  openGraph: {
    title,
    description,
    url: "https://kionixinterior.com",
    siteName: "Kionix Interior",
    images: [{ url: ogImage }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to content
        </a>
        <Navbar />
        <div id="main-content">{children}</div>
        <FloatingWA />
        <WaLeadModal />
      </body>
    </html>
  );
}
