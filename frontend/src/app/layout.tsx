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
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "381685213572-8632pqeq0h5slq0072n3ev58aoefpor1.apps.googleusercontent.com";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <html
          lang="pt-BR"
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
          <body className="min-h-full flex flex-col bg-gray-50">
            <Toaster position="top-right" toastOptions={{ className: 'font-bold font-sans' }} />
            <MainLayout>
              {children}
            </MainLayout>
          </body>
        </html>
      </GoogleOAuthProvider>
    </AuthProvider>
  );
}
