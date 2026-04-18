"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ArrowLeft, 
  LogOut, 
  Settings, 
  Activity, 
  Menu, 
  X,
  ChevronRight
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Usuários", icon: Users, href: "/admin/usuarios" },
    { label: "Cenários Clínicos", icon: BookOpen, href: "/admin/casos" },
    { label: "Auditoria", icon: Activity, href: "/admin/auditoria" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-72" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed h-full z-30`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span>ADMIN<span className="text-blue-500">.</span></span>
            </Link>
          ) : (
            <Activity className="w-8 h-8 text-blue-500 mx-auto" />
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors group relative"
            >
              <item.icon className={`w-5 h-5 ${isSidebarOpen ? "" : "mx-auto"} text-slate-400 group-hover:text-blue-400 transition-colors`} />
              {isSidebarOpen && (
                <span className="font-bold text-slate-300 group-hover:text-white">{item.label}</span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
          >
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? "" : "mx-auto"}`} />
            {isSidebarOpen && <span className="font-bold">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-20"}`}>
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6 text-slate-500" /> : <Menu className="w-6 h-6 text-slate-500" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800">{user.full_name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Administrador</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <UserCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

import { UserCircle } from "lucide-react";
