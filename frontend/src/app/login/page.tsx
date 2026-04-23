"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Mail, Lock, ArrowRight, Activity, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side: Illustration & Info */}
      <div className="hidden md:flex md:w-1/2 bg-gray-900 relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group text-white mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg group-hover:scale-105 transition-transform">
              <span className="font-black text-xl">M</span>
            </div>
            <span className="text-2xl font-black tracking-tight">MedMaster</span>
          </Link>

          <div className="space-y-6 max-w-md mt-20">
            <h2 className="text-5xl font-black text-white leading-tight">
              A revolução no estudo para o <span className="text-indigo-400">Revalida</span>.
            </h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed">
              Utilizamos inteligência artificial para simular cenários reais e garantir que você esteja 100% preparado para a revalidação.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-sm">
             <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Sparkles size={24} />
             </div>
             <div>
                <p className="text-white font-bold text-sm">Preceptor IA Ativo</p>
                <p className="text-gray-500 text-xs font-medium">Feedback em tempo real por voz</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-right duration-700">
          <div className="md:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <span className="font-black">M</span>
              </div>
              <span className="text-xl font-black text-gray-900">MedMaster</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Seja bem-vindo</h3>
            <p className="text-gray-500 font-medium">Insira suas credenciais para acessar sua conta.</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-in shake duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha</label>
                  <Link href="#" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider">Esqueceu a senha?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Activity className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Entrar na Conta
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-50 text-center">
              <p className="text-gray-500 text-sm font-bold">
                Novo por aqui?{" "}
                <Link href="/register" className="text-indigo-600 font-black hover:underline">
                  Crie sua conta gratuitamente
                </Link>
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
             <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                <ChevronLeft size={16} />
                Voltar para Início
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
