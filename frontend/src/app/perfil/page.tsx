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
  Trophy,
  CreditCard,
  Receipt,
  FileText,
  Download,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import api, { BASE_URL } from "@/lib/api";
import toast from "react-hot-toast";
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
  
  const [activeSessions, setActiveSessions] = useState<SimuladoSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [financeData, setFinanceData] = useState<{subscription: any, payments: any[]}>({ subscription: null, payments: [] });
  const [isLoadingFinance, setIsLoadingFinance] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

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
      setEditName(user.full_name || "");
      setEditEmail(user.email || "");
      setEditCpf(user.cpf || "");
      setEditPhone(user.phone || "");
      loadActiveSessions();
      loadFinance();
    }
  }, [user]);

  async function loadFinance() {
    try {
      const res = await api.get("/payments/history");
      setFinanceData(res.data);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      setIsLoadingFinance(false);
    }
  }

  async function handleCancelSubscription() {
    if (!financeData.subscription?.id) return;
    
    setModalConfig({
      isOpen: true,
      title: "Cancelar Assinatura",
      message: "Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o fim do ciclo que já foi pago, mas novas cobranças não serão geradas.",
      type: "danger",
      onConfirm: async () => {
        setIsCanceling(true);
        setModalConfig({ ...modalConfig, isOpen: false });
        try {
          await api.delete(`/payments/subscription/${financeData.subscription.id}`);
          toast.success("Assinatura cancelada com sucesso.");
          loadFinance();
          refreshUser();
        } catch (error) {
          console.error("Erro ao cancelar assinatura:", error);
          toast.error("Erro ao cancelar assinatura. Tente novamente mais tarde.");
        } finally {
          setIsCanceling(false);
        }
      }
    });
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setUpdateError("");
    try {
      await api.patch("/auth/profile", {
        full_name: editName,
        email: editEmail,
        cpf: editCpf,
        phone: editPhone
      });
      await refreshUser();
      setIsEditModalOpen(false);
      toast.success("Perfil atualizado com sucesso!");
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
          toast.success("Sessão excluída com sucesso.");
        } catch (err) {
          console.error("Erro ao excluir sessão:", err);
          toast.error("Erro ao excluir sessão.");
        }
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/auth/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      console.error("Erro ao fazer upload da imagem:", err);
      toast.error("Erro ao enviar imagem. Verifique o formato.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 p-8">
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
                        src={`${BASE_URL}${user.profile_image}`} 
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

          {/* Quick Stats in Profile V2 */}
          {/* <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
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
          </div> */}
        </div>

        {/* Right Column: AI Config & Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Financeiro */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden">
            <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <CreditCard className="text-indigo-600" />
              Assinatura e Financeiro
            </h2>
            
            {isLoadingFinance ? (
               <div className="flex items-center justify-center py-8"><Activity className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : financeData.subscription ? (
               <div className="space-y-8">
                 {/* Current Plan Info */}
                 <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-4">
                       <div>
                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Plano Atual</h4>
                         <p className="text-lg font-black text-gray-900">{financeData.subscription.description}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${financeData.subscription.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                         {financeData.subscription.status === "ACTIVE" ? "Ativo" : financeData.subscription.status}
                       </span>
                    </div>
                    
                    {financeData.payments.length > 0 && financeData.payments[0].creditCard && (
                       <div className="flex items-center gap-3 mt-6 p-4 bg-white/60 rounded-2xl border border-white">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <CreditCard size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-gray-500">Cartão de Crédito Salvo</p>
                            <p className="text-sm font-black text-gray-900">
                               {financeData.payments[0].creditCard.creditCardBrand} final {financeData.payments[0].creditCard.creditCardNumber}
                            </p>
                         </div>
                       </div>
                    )}
                    
                    <div className="mt-6 flex gap-3">
                       <button 
                         onClick={handleCancelSubscription}
                         disabled={isCanceling}
                         className="flex-1 text-red-600 font-bold text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {isCanceling ? <Activity className="w-4 h-4 animate-spin" /> : null}
                         Cancelar Assinatura
                       </button>
                    </div>
                 </div>

                 {/* Payment History */}
                 <div>
                    <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                       <Receipt size={18} className="text-gray-400" />
                       Últimos Pagamentos
                    </h4>
                    <div className="space-y-3">
                       {financeData.payments.slice(0, 3).map((pay: any) => (
                          <div key={pay.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-indigo-100 transition-colors group">
                             <div>
                               <p className="text-sm font-bold text-gray-900">R$ {pay.value.toFixed(2).replace('.', ',')}</p>
                               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{new Date(pay.dateCreated).toLocaleDateString('pt-BR')}</p>
                             </div>
                             <div className="flex items-center gap-3">
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${pay.status === 'CONFIRMED' || pay.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {pay.status === 'CONFIRMED' || pay.status === 'RECEIVED' ? 'Pago' : pay.status === 'PENDING' ? 'Pendente' : pay.status}
                               </span>
                               {pay.transactionReceiptUrl ? (
                                  <a href={pay.transactionReceiptUrl} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors" title="Ver Comprovante">
                                     <Download size={14} />
                                  </a>
                               ) : pay.invoiceUrl && pay.status === 'PENDING' ? (
                                  <a href={pay.invoiceUrl} target="_blank" rel="noreferrer" className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors" title="Pagar Fatura">
                                     <DollarSign size={14} />
                                  </a>
                               ) : null}
                             </div>
                          </div>
                       ))}
                    </div>
                    {financeData.payments.length > 3 && (
                       <button 
                         onClick={() => setIsPaymentsModalOpen(true)}
                         className="w-full mt-4 py-3 bg-gray-50 text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors"
                       >
                         Ver Todos ({financeData.payments.length})
                       </button>
                    )}
                 </div>
               </div>
            ) : (
               <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                     <FileText size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Nenhuma assinatura ativa</h3>
                  <p className="text-sm text-gray-500 mb-6">Você ainda não escolheu um plano premium.</p>
                  <Link href="/planos" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md">
                     Ver Planos
                  </Link>
               </div>
            )}
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
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                  <input 
                    type="text"
                    value={editCpf}
                    onChange={(e) => setEditCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="Somente números"
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input 
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="Somente números"
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                  />
                </div>
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

      {/* Payments History Modal */}
      {isPaymentsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full border border-gray-100 animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                 <Receipt className="text-indigo-600" />
                 Histórico Completo
              </h2>
              <button 
                onClick={() => setIsPaymentsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
               {financeData.payments.map((pay: any) => (
                  <div key={pay.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-indigo-100 transition-colors group">
                     <div>
                       <p className="text-sm font-bold text-gray-900">R$ {pay.value.toFixed(2).replace('.', ',')}</p>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{new Date(pay.dateCreated).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${pay.status === 'CONFIRMED' || pay.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {pay.status === 'CONFIRMED' || pay.status === 'RECEIVED' ? 'Pago' : pay.status === 'PENDING' ? 'Pendente' : pay.status}
                       </span>
                       {pay.transactionReceiptUrl ? (
                          <a href={pay.transactionReceiptUrl} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors" title="Ver Comprovante">
                             <Download size={14} />
                          </a>
                       ) : pay.invoiceUrl && pay.status === 'PENDING' ? (
                          <a href={pay.invoiceUrl} target="_blank" rel="noreferrer" className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors" title="Pagar Fatura">
                             <DollarSign size={14} />
                          </a>
                       ) : null}
                     </div>
                  </div>
               ))}
            </div>
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
