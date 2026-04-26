"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Mail, Lock, User, ArrowRight, CheckCircle2, Activity, ChevronLeft, Sparkles, Phone, CreditCard } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", formData);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar conta. Tente outro e-mail.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center animate-in zoom-in duration-500">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mb-8">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <h2 className="text-3xl font-black text-gray-900 mb-4">Conta Criada!</h2>
           <p className="text-gray-500 font-medium leading-relaxed">Bem-vindo à elite dos médicos revalidantes. Você será redirecionado para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side: Brand & Info */}
      <div className="hidden md:flex md:w-1/2 bg-gray-900 relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group text-white mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="font-black text-xl">M</span>
            </div>
            <span className="text-2xl font-black tracking-tight">MedMaster</span>
          </Link>

          <div className="space-y-6 max-w-md mt-20">
            <h2 className="text-5xl font-black text-white leading-tight">
              Faça parte da <span className="text-indigo-400">elite</span>.
            </h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed">
              Junte-se a milhares de médicos que estão utilizando tecnologia de ponta para conquistar o Revalida.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-sm">
             <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Sparkles size={24} />
             </div>
             <div>
                <p className="text-white font-bold text-sm">Simulações Realistas</p>
                <p className="text-gray-500 text-xs font-medium">Casos clínicos baseados em editais Revalida</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-right duration-700 py-12">
          <div className="md:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <span className="font-black">M</span>
              </div>
              <span className="text-xl font-black text-gray-900">MedMaster</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Criar sua conta</h3>
            <p className="text-gray-500 font-medium">Preencha os campos abaixo para iniciar seus estudos.</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-in shake duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                    placeholder="Seu Nome Completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      name="cpf"
                      required
                      value={formData.cpf}
                      onChange={(e) => {
                         // Mascara basica de CPF apenas numeros (o asaas aceita formatado ou nao)
                         const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                         setFormData({ ...formData, cpf: val });
                      }}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Somente números"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                         setFormData({ ...formData, phone: val });
                      }}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Ex: 11999999999"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Mín. 8 chars"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Repetir</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Repita a senha"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-gray-400 font-medium text-center px-4 leading-relaxed">
                Ao criar sua conta, você concorda com nossos{" "}
                <Link href="/termos" className="text-indigo-600 hover:underline">Termos de Uso</Link>{" "}
                e nossa{" "}
                <Link href="/privacidade" className="text-indigo-600 hover:underline">Política de Privacidade</Link>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <Activity className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Criar minha conta
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-50 text-center">
              <p className="text-gray-500 text-sm font-bold">
                Já possui conta?{" "}
                <Link href="/login" className="text-indigo-600 font-black hover:underline">
                  Fazer login agora
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
