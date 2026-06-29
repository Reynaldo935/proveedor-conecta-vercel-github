import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { FetchInterceptor } from "@/components/layout/fetch-interceptor";
import { ConnectionBanner } from "@/components/layout/connection-banner";
import { ClerkAuthSync } from "@/components/auth/clerk-auth-sync";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProveedorConecta Nicaragua - Marketplace B2B/B2C para MIPYMES",
  description: "Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en Nicaragua. 17 departamentos, 5 métodos de pago, chat en tiempo real.",
  keywords: ["Nicaragua", "proveedores", "MIPYMES", "marketplace", "B2B", "emprendedores", "ferretería", "agricultura", "tecnología", "Managua", "León", "Granada"],
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "ProveedorConecta Nicaragua - Marketplace B2B/B2C",
    description: "Conectamos emprendedores y MIPYMES con proveedores de insumos en toda Nicaragua. 500+ proveedores, 2000+ productos.",
    type: "website",
    locale: "es_NI",
    siteName: "ProveedorConecta Nicaragua",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProveedorConecta Nicaragua",
    description: "Marketplace B2B/B2C para emprendedores nicaragüenses",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={`${poppins.variable} ${inter.variable} ${jetbrains.variable} antialiased font-sans bg-[#00BCD4] dark:bg-[#010a19] text-black dark:text-[#F5F5F5] min-h-screen`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="pc-theme"
          >
            <FetchInterceptor />
            <ConnectionBanner />
            <ClerkAuthSync />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
