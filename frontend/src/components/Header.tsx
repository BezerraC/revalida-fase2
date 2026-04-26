"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BASE_URL } from "@/lib/api";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Fase 1: Objetiva", href: "/fase1" },
    { name: "Fase 2: Prática", href: "/fase2" },
    { name: "Histórico", href: "/historico" },
    { name: "Perfil", href: "/perfil" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-4"
          : "bg-white backdrop-blur-md shadow-sm py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Left: Logo and Menu */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                MedMaster
              </span>
            </Link>

            {/* Desktop Navigation */}
            {/* <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav> */}
          </div>

          {/* Right: User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/perfil" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-xs text-gray-500 font-medium">Bem-vindo</span>
                    <span className="text-sm font-semibold text-gray-800">{user.full_name.split(' ')[0]}</span>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl overflow-hidden flex items-center justify-center border border-indigo-100">
                    {user.profile_image ? (
                      <img 
                        src={`${BASE_URL}${user.profile_image}`} 
                        alt={user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-indigo-600" />
                    )}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-xl"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-indigo-200 shadow-lg hover:bg-indigo-700 transition-all duration-200"
              >
                <User size={18} />
                <span>Entrar</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 transition-all duration-300 transform ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between p-4 rounded-xl text-base font-medium ${
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{link.name}</span>
              <ChevronRight size={18} className={pathname === link.href ? "opacity-100" : "opacity-0"} />
            </Link>
          ))}
          {!user && (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
            >
              <User size={20} />
              <span>Entrar na Conta</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
