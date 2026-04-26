"use client";

import { Lock, ArrowRight, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RestrictedAccessPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-50 rounded-full blur-[120px]" />
      </div>

      <div className="flex-grow flex items-center justify-center p-8 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-12">
          {/* Animated Lock Icon */}
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-indigo-600 blur-[40px] opacity-20 animate-pulse" />
             <div className="relative w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
                <Lock size={40} />
             </div>
             <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <ShieldAlert size={14} />
             </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Acesso <span className="text-indigo-600">Restrito</span>.
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg mx-auto">
              Olá, <span className="text-gray-900 font-bold">{user?.full_name?.split(' ')[0]}</span>! 
              Identificamos que você ainda não possui um plano ativo para acessar esta área da plataforma.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Simulador de Voz</h3>
                <p className="text-xs text-gray-500">Treine conversando com nossa IA para a Fase 2.</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Banco de Questões</h3>
                <p className="text-xs text-gray-500">Milhares de questões comentadas e estatísticas.</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/#planos"
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 group"
            >
              Ver Planos de Acesso <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={logout}
              className="w-full sm:w-auto px-10 py-5 bg-white text-gray-600 font-bold rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
            >
              Sair da Conta <LogOut size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-400 font-medium">
            Dúvidas? <Link href="https://wa.me/5596984176164" className="text-indigo-600 hover:underline">Fale com nosso suporte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
