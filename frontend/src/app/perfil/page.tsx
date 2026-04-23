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
  History, 
  BookOpen, 
  Stethoscope, 
  ArrowRight, 
  Key, 
  ExternalLink, 
  ChevronRight,
  CheckCircle, 
  X, 
  Save,
  Target,
  Clock,
  Play,
  Sparkles,
  Trash2,
  Camera,
  Trophy
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "info" | "success" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info"
  });

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
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
      setUpdateError(error.response?.data?.detail || "Erro ao atualizar perfil.");
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

  const handleDeleteSession = (sessionId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Excluir Progresso",
      message: "Tem certeza que deseja excluir este simulado em progresso? Esta ação não pode ser desfeita.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/simulado/sessions/${sessionId}`);
          setActiveSessions(activeSessions.filter(s => s._id !== sessionId));
        } catch (err) {
          console.error("Erro ao excluir sessão:", err);
        }
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingImage(true);
    try {
      await api.post("/auth/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
    } catch (err) {
      console.error("Erro ao fazer upload da imagem:", err);
      alert("Erro ao enviar imagem. Verifique o formato.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
      {/* Breadcrumb / Navigation */}
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Dashboard
        </Link>
        <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
          Minha Conta <ChevronRight size={14} /> Perfil
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Info Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800" />
            <div className="px-8 pb-8">
              <div className="relative -mt-12 mb-6">
                <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center p-1 group overflow-hidden">
                  <div className="w-full h-full bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 overflow-hidden relative">
                    {user.profile_image ? (
                      <img 
                        src={`http://localhost:8000${user.profile_image}`} 
                        alt={user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} />
                    )}
                    
                    {/* Upload Overlay */}
                    <label 
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${isUploadingImage ? 'opacity-100 cursor-wait' : ''}`}
                    >
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                      {isUploadingImage ? (
                        <Activity className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 mb-8">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">{user.full_name}</h1>
                <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-70" />
                  {user.email}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acesso</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Estudante'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membro desde</span>
                  <span className="text-sm font-bold text-gray-700">{formatDate(user.created_at)}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full mt-8 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
              >
                <Settings size={18} />
                Editar Informações
              </button>
            </div>
          </div>

          {/* Score & Level */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              Desempenho
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Level</p>
                <p className="text-2xl font-black text-amber-700">{user.level || 1}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Score Total</p>
                <p className="text-2xl font-black text-indigo-700">{user.total_score || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats in Profile */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              Segurança
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="text-emerald-600" size={20} />
                <span className="text-sm font-bold text-emerald-700">Conta Verificada</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3 grayscale opacity-60">
                <Shield className="text-gray-400" size={20} />
                <span className="text-sm font-bold text-gray-500">2FA Desativado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Config & Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI API Configuration */}
          <section className="bg-gray-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <Sparkles className="text-indigo-400" />
                    Inteligência Artificial
                  </h2>
                  <p className="text-gray-400 font-medium text-sm">Configure sua chave Gemini para habilitar o Preceptor IA e as simulações.</p>
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all uppercase tracking-widest"
                >
                  <ExternalLink size={14} />
                  Obter Chave
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Sua Gemini API Key"
                    className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                  />
                  {saveKeySuccess && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 animate-in zoom-in" size={20} />
                  )}
                </div>
                <button 
                  onClick={handleSaveApiKey}
                  disabled={isSavingKey}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-900/40"
                >
                  {isSavingKey ? "Salvando..." : saveKeySuccess ? "Salvo!" : "Salvar Chave"}
                </button>
              </div>
            </div>
          </section>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden">
              <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <Clock className="text-indigo-600" />
                Sessões Ativas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessions.map((session) => {
                  const answered = Object.keys(session.answers || {}).length;
                  return (
                    <div 
                      key={session._id}
                      className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                          <Target size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900">{session.exam_id ? session.exam_id.replace('_', ' ') : session.theme}</h4>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {answered} Respostas &bull; {session.mode}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <button 
                          onClick={() => handleResume(session)}
                          className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                        >
                          Retomar <ArrowRight size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSession(session._id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir progresso"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Activity History Quick Links */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl">
            <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <History className="text-indigo-600" />
              Histórico de Atividades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/historico?tab=simulado" className="group p-6 bg-indigo-50/50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">Questões Teóricas</h4>
                  <p className="text-xs font-bold text-indigo-400 uppercase">Fase 1</p>
                </div>
                <ChevronRight className="ml-auto text-indigo-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link href="/historico?tab=fase2" className="group p-6 bg-violet-50/50 rounded-3xl border border-transparent hover:border-violet-100 hover:bg-white hover:shadow-xl transition-all flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                  <Stethoscope size={28} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">Simulações Práticas</h4>
                  <p className="text-xs font-bold text-violet-400 uppercase">Fase 2</p>
                </div>
                <ChevronRight className="ml-auto text-violet-200 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </section>

          <button 
            onClick={logout}
            className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors py-4 px-8"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full border border-gray-100 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Editar Perfil</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                />
              </div>

              {updateError && (
                <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-2xl border border-red-100">{updateError}</p>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100"
                >
                  {isUpdatingProfile ? "Salvando..." : "Salvar Alterações"}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        confirmText="Sim, Excluir"
        cancelText="Não, Voltar"
      />
    </div>
  );
}
