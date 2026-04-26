"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Mail, Lock, ArrowRight, Activity, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "forgot" | "verify" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("Código enviado! Verifique seu e-mail.");
      setView("verify");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao solicitar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      setView("reset");
      setError("");
      setSuccess("");
    } else {
      setError("O código deve ter 6 dígitos.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { 
        email, 
        code, 
        new_password: newPassword 
      });
      setSuccess("Senha alterada com sucesso! Faça login.");
      setView("login");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao resetar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
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

      {/* Right Side: Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="md:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <span className="font-black">M</span>
              </div>
              <span className="text-xl font-black text-gray-900">MedMaster</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {view === "login" && "Seja bem-vindo"}
              {view === "forgot" && "Recuperar Senha"}
              {view === "verify" && "Verificar Código"}
              {view === "reset" && "Nova Senha"}
            </h3>
            <p className="text-gray-500 font-medium">
              {view === "login" && "Insira suas credenciais para acessar sua conta."}
              {view === "forgot" && "Insira seu e-mail para receber o código de 6 dígitos."}
              {view === "verify" && `Enviamos um código para ${email}.`}
              {view === "reset" && "Crie uma nova senha segura para sua conta."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 mb-6 animate-in shake duration-300">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-bold border border-emerald-100 mb-6">
                {success}
              </div>
            )}

            {/* LOGIN VIEW */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-6">
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
                    <button 
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                      className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider"
                    >
                      Esqueceu a senha?
                    </button>
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
                  {loading ? <Activity className="w-6 h-6 animate-spin" /> : <>Entrar na Conta <ArrowRight size={18} /></>}
                </button>

                {/* Social Login Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                    <span className="bg-white px-4 text-gray-400">Ou continue com</span>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    className="flex items-center justify-center gap-3 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 font-bold text-sm text-gray-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.51-3.51C18.1 1.42 15.35 0 12 0 7.31 0 3.25 2.69 1.25 6.63l4.1 3.18C6.3 7.31 8.97 5.04 12 5.04z"/>
                      <path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.28 1.48-1.11 2.73-2.36 3.58l4.1 3.18c2.4-2.21 3.78-5.46 3.78-9z"/>
                      <path fill="#FBBC05" d="M5.35 14.31c-.13-.38-.2-.78-.2-1.19s.07-.81.2-1.19L1.25 8.75C.45 10.33 0 12.11 0 14c0 1.89.45 3.67 1.25 5.25l4.1-3.18z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.1-3.18c-1.1.74-2.51 1.18-3.83 1.18-3.03 0-5.7-2.27-6.61-5.31l-4.1 3.18C3.25 21.31 7.31 24 12 24z"/>
                    </svg>
                    Google
                  </button>
                  <button 
                    type="button"
                    className="flex items-center justify-center gap-3 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 font-bold text-sm text-gray-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {view === "forgot" && (
              <form onSubmit={handleRequestCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu E-mail</label>
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

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? <Activity className="w-6 h-6 animate-spin" /> : "Enviar Código"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView("login")}
                    className="w-full py-4 text-gray-500 font-bold text-sm hover:text-gray-700"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </form>
            )}

            {/* VERIFY CODE VIEW */}
            {view === "verify" && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Código de 6 Dígitos</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-4 py-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-black text-3xl tracking-[1em] text-center"
                    placeholder="000000"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    Verificar Código
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView("forgot")}
                    className="w-full py-2 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    Reenviar Código
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD VIEW */}
            {view === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? <Activity className="w-6 h-6 animate-spin" /> : "Atualizar Senha"}
                </button>
              </form>
            )}

            {view === "login" && (
              <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                <p className="text-gray-500 text-sm font-bold">
                  Novo por aqui?{" "}
                  <Link href="/register" className="text-indigo-600 font-black hover:underline">
                    Crie sua conta gratuitamente
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
