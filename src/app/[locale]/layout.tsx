import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cormorant_Garamond, Plus_Jakarta_Sans, Noto_Sans_SC } from "next/font/google";
import { routing } from '@/i18n/routing';
import Navbar from "@/components/Navbar";
import FloatingWA from "@/components/FloatingWA";
import WaLeadModal from "@/components/WaLeadModal";
import "../globals.css";

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

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});

const ogImage = "/og-image.jpg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL("https://kionixinterior.com"),
    title,
    description,
    keywords: t.raw('keywords') as string[],
    alternates: {
      languages: {
        id: 'https://kionixinterior.com',
        en: 'https://kionixinterior.com/en',
        zh: 'https://kionixinterior.com/zh',
      },
    },
    openGraph: {
      title,
      description,
      url: locale === 'id' ? 'https://kionixinterior.com' : `https://kionixinterior.com/${locale}`,
      siteName: "Kionix Interior",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : locale === 'zh' ? 'zh_CN' : 'en_US',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${cormorant.variable} ${jakarta.variable} ${notoSansSC.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded">
            Skip to content
          </a>
          <Navbar />
          <div id="main-content">{children}</div>
          <FloatingWA />
          <WaLeadModal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
