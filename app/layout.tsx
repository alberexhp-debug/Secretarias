import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Secretario IA — Tu asistente virtual 24/7",
  description:
    "Secretario IA permite a cualquier dueño de PYME tener un asistente virtual con IA operando 24/7, sin conocimiento técnico. Atiende WhatsApp, email y agenda citas automáticamente.",
  keywords: ["secretario virtual", "asistente IA", "PYME", "WhatsApp bot", "agenda automática", "México"],
  authors: [{ name: "Secretario IA" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secretario IA",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    title: "Secretario IA — Tu asistente virtual 24/7",
    description: "Atiende a tus clientes por WhatsApp y email automáticamente con IA. Desde $499 MXN/mes.",
    siteName: "Secretario IA",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
