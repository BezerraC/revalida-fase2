"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "@/context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const isNoLayoutPath = pathname?.startsWith("/admin") || pathname === "/login" || pathname === "/register" || pathname === "/" || pathname === "/acesso-restrito";

  useEffect(() => {
    if (!loading) {
      const isPublicPath = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/acesso-restrito";
      
      if (!user) {
         if (!isPublicPath) {
            router.push("/login");
         } else {
            setIsReady(true);
         }
      } else {
         const hasPlan = user.subscription_status === "active" || user.role === "admin";
         
         if (!hasPlan && !isPublicPath) {
            router.push("/acesso-restrito");
         } else if (hasPlan && pathname === "/") {
            router.push("/dashboard");
         } else {
            setIsReady(true);
         }
      }
    }
  }, [loading, user, pathname, router]);

  if (loading || !isReady) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
     );
  }

  if (isNoLayoutPath) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow pt-[72px] pb-12">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;
