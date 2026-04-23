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
  title: "MedMaster - Plataforma de Estudos para o Revalida",
  description: "A plataforma definitiva para sua preparação para o Revalida. Questões comentadas, simulados oficiais e prática com IA.",
};

import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-gray-50">
          <MainLayout>
            {children}
          </MainLayout>
        </body>
      </html>
    </AuthProvider>
  );
}
