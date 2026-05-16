import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";

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
  title: "ProveedorConecta Nicaragua - Marketplace B2B/B2C",
  description: "Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en Nicaragua.",
  keywords: ["Nicaragua", "proveedores", "MIPYMES", "marketplace", "B2B", "emprendedores"],
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "ProveedorConecta Nicaragua",
    description: "Marketplace B2B/B2C para emprendedores nicaragüenses",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} ${jetbrains.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="pc-theme"
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
