"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  LogOut, 
  ArrowLeft, 
  Activity, 
  Settings, 
  UserCircle, 
  History, 
  BookOpen, 
  Stethoscope, 
  ArrowRight, 
  Key, 
  ExternalLink, 
  CheckCircle, 
  X, 
  Save,
  Target,
  Clock,
  Play
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface SimuladoSession {
    _id: string;
    exam_id?: string;
    theme?: string;
    answers: Record<string, string>;
    elapsed_time: number;
    created_at: string;
    mode: string;
    current_index: number;
    time_limit: string;
}

export default function ProfilePage() {
  const { user, logout, loading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [apiKey, setApiKey] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);

  const [activeSessions, setActiveSessions] = useState<SimuladoSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (user) {
      setApiKey(user.gemini_api_key || "");
      setEditName(user.full_name || "");
      setEditEmail(user.email || "");
      loadActiveSessions();
    }
  }, [user]);

  async function loadActiveSessions() {
    try {
      const res = await api.get("/simulado/active");
      setActiveSessions(res.data);
    } catch (err) {
      console.error("Erro ao carregar sessões ativas:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    setSaveKeySuccess(false);
    try {
      await api.patch("/auth/profile/api-key", { api_key: apiKey });
      await refreshUser();
      setSaveKeySuccess(true);
      setTimeout(() => setSaveKeySuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar chave:", error);
      alert("Erro ao salvar a chave. Tente novamente.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setUpdateError("");
    try {
      await api.patch("/auth/profile", {
        full_name: editName,
        email: editEmail
      });
      await refreshUser();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      setUpdateError(error.response?.data?.detail || "Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleResume = (session: SimuladoSession) => {
      let url = `/fase1/simulado/questoes?session_id=${session._id}&mode=${session.mode}&time_limit=${session.time_limit}`;
      if (session.exam_id) url += `&exam_id=${session.exam_id}`;
      if (session.theme) url += `&theme=${session.theme}`;
      router.push(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12 font-sans bg-[grid-slate-200_1px_1px] bg-[size:32px_32px]">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-all"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl font-bold border border-blue-100">
            <UserCircle className="w-5 h-5" />
            Perfil do Usuário
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
             <div className="absolute -bottom-16 left-10 p-2 bg-white rounded-[2rem] shadow-xl">
                <div className="w-32 h-32 bg-slate-100 rounded-[1.5rem] flex items-center justify-center border-4 border-white overflow-hidden text-slate-400">
                   <User className="w-16 h-16" />
                </div>
             </div>
          </div>
          
          <div className="pt-20 px-10 pb-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-800">{user.full_name}</h1>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                  user.role === 'admin' 
                    ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50' 
                    : 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50'
                }`}>
                  {user.role === 'admin' ? 'Administrador' : 'Estudante'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Conta</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro desde</p>
                  <p className="text-slate-700 font-bold">{formatDate(user.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Conta</p>
                  <p className="text-emerald-600 font-black">Ativa e Segura</p>
                </div>
              </div>
            </div>

            {/* AI Config Section */}
            <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl group-hover:bg-blue-600/30 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Key className="w-6 h-6 text-blue-400" />
                    Chave de API do Gemini
                  </h3>
                   <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver Tutorial
                  </a>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Para utilizar a Plataforma, você deve configurar sua própria chave de API. <br/>
                  <span className="text-amber-400/80 font-bold italic text-xs">O sistema não funcionará sem uma chave configurada.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Cole sua chave aqui (ex: AIza...)"
                      className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                    />
                    {saveKeySuccess && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleSaveApiKey}
                    disabled={isSavingKey}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-900/20 shrink-0"
                  >
                    {isSavingKey ? "Salvando..." : saveKeySuccess ? "Salvo!" : "Salvar Chave"}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Simulations Section */}
            {activeSessions.length > 0 && (
                <div className="mt-12 space-y-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Simulados em Andamento
                    </h3>
                    <div className="space-y-4">
                        {activeSessions.map((session) => {
                            const answered = Object.keys(session.answers || {}).length;
                            return (
                                <div 
                                    key={session._id}
                                    className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                            <Target className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800">
                                                {session.exam_id ? session.exam_id.replace('_', ' ') : session.theme}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {answered} Questões respondidas &bull; {session.mode}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleResume(session)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        Retomar <Play className="w-3 h-3 fill-current" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* History Section */}
            <div className="mt-12">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Histórico de Atividades
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link 
                  href="/historico?tab=fase2"
                  className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800">Simulações Práticas</p>
                      <p className="text-xs font-bold text-slate-500 italic">Fase 2</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link 
                  href="/historico?tab=fase1"
                  className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-100 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800">Questões Teóricas</p>
                      <p className="text-xs font-bold text-slate-500 italic">Fase 1</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 flex flex-wrap gap-4">
               <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
               >
                  <Settings className="w-5 h-5" />
                  Editar Perfil
               </button>
               <button 
                  onClick={logout}
                  className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold border border-slate-200 hover:border-red-200 transition-all active:scale-95 group shadow-sm"
               >
                  <LogOut className="w-5 h-5 text-red-500 group-hover:-translate-x-1 transition-transform" />
                  Sair
               </button>
            </div>
          </div>
        </div>

        <div className="text-center px-10">
           <div className="inline-flex items-center gap-2 text-slate-300 font-bold text-sm">
              <Activity className="w-4 h-4" />
              Revalida AI Pro &bull; Plataforma de Estudos Inteligente
           </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-white/20 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">Editar Perfil</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {updateError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
                  {updateError}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar Alterações
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
