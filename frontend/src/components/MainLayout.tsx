"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const pathname = usePathname();
  const isNoLayoutPath = pathname?.startsWith("/admin") || pathname === "/login" || pathname === "/register";

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
