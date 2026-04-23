"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  ArrowRight, 
  BookOpen, 
  Target, 
  Activity, 
  ChevronRight,
  Plus,
  Clock,
  Baby,
  Play,
  Award,
  Sparkles,
  Trash2
} from "lucide-react";
import api from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

interface SimuladoSession {
    _id: string;
    exam_id?: string;
    theme?: string;
    answers: Record<string, string>;
    current_index: number;
    created_at: string;
    mode: string;
    time_limit: string;
}

export default function Fase1Menu() {
  const router = useRouter();
  const [themes, setThemes] = useState<{name: string, color: string, icon: React.ReactNode}[]>([]);
  const [activeSessions, setActiveSessions] = useState<SimuladoSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

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
    async function loadData() {
      try {
        const [themesRes, sessionsRes] = await Promise.all([
            api.get("/themes"),
            api.get("/simulado/active")
        ]);

        const themeNames = themesRes.data as string[];
        const areaConfigs: Record<string, {color: string, icon: React.ReactNode}> = {
          "Clínica Médica": { color: "bg-blue-50 text-blue-700 border-blue-100", icon: <Activity size={20} /> },
          "Cirurgia Geral": { color: "bg-red-50 text-red-700 border-red-100", icon: <Sparkles size={20} /> },
          "Ginecologia e Obstetrícia": { color: "bg-pink-50 text-pink-700 border-pink-100", icon: <Award size={20} /> },
          "Pediatria": { color: "bg-amber-50 text-amber-700 border-amber-100", icon: <Baby size={20} /> },
          "Saúde Coletiva": { color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <Target size={20} /> },
        };

        setThemes(themeNames.map((name) => ({
          name,
          color: areaConfigs[name]?.color || "bg-slate-50 text-slate-700 border-slate-100",
          icon: areaConfigs[name]?.icon || <BookOpen size={20} />
        })));

        setActiveSessions(sessionsRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados da home:", err);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadData();
  }, []);

  const handleStartTutor = async () => {
    try {
      const res = await api.post("/fase1/chat", {
        message: { text: "Olá Preceptor!" }
      });
      if (res.data.session_id) {
        router.push(`/fase1/${res.data.session_id}`);
      }
    } catch (err) {
      console.error("Erro ao iniciar tutor:", err);
    }
  };

  const handleResume = (session: SimuladoSession) => {
      let url = `/fase1/simulado/questoes?session_id=${session._id}&mode=${session.mode}&time_limit=${session.time_limit}`;
      if (session.exam_id) url += `&exam_id=${session.exam_id}`;
      if (session.theme) url += `&theme=${session.theme}`;
      router.push(url);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      title: "Excluir Progresso",
      message: "Deseja realmente apagar este simulado em andamento?",
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Fase 1: Prova Objetiva</h1>
          <p className="text-lg text-gray-500 font-medium">Treinamento avançado para a prova teórica do Revalida.</p>
        </div>
      </div>

      {/* Main Study Modes */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Preceptor IA */}
        <div 
          onClick={handleStartTutor}
          className="group relative bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl cursor-pointer overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-32 translate-x-32 group-hover:scale-110 transition-transform duration-700 opacity-50" />
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
              <Bot className="w-9 h-9 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">Preceptor IA <br/>por Voz</h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                Estudo dirigido com feedback em tempo real. Discuta temas clínicos, tire dúvidas por voz e gere mapas mentais automáticos.
              </p>
            </div>
            <div className="flex items-center gap-3 text-indigo-600 font-bold pt-4">
              <span className="text-sm">Iniciar Estudo Individual</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        {/* Simulados Oficiais */}
        <div 
          onClick={() => router.push("/fase1/simulado")}
          className="group relative bg-gray-900 rounded-3xl p-8 md:p-10 shadow-2xl cursor-pointer overflow-hidden hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-32 translate-x-32 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Target className="w-9 h-9 text-gray-900" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-tight">Simulados <br/>Oficiais</h2>
              <p className="text-gray-400 font-medium leading-relaxed">
                Treine com as questões reais de todas as edições do Revalida Inep. Filtre por tema e analise seu desempenho por área.
              </p>
            </div>
            <div className="flex items-center gap-3 text-indigo-400 font-bold pt-4">
              <span className="text-sm">Configurar Novo Simulado</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      {!loadingSessions && activeSessions.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900">Continuar Simulado</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session) => {
              const answered = Object.keys(session.answers || {}).length;
              return (
                <div 
                  key={session._id}
                  onClick={() => handleResume(session)}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Play size={20} className="fill-indigo-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {session.mode === 'simulado' ? 'Contrarrelógio' : 'Estudo'}
                        </span>
                        <button 
                          onClick={(e) => handleDeleteSession(e, session._id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {session.exam_id ? session.exam_id.replace('_', ' ') : session.theme}
                    </h4>
                    <p className="text-sm text-gray-400 font-medium">
                      {answered > 0 ? `${answered} questões respondidas` : 'Iniciado agora'}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between text-indigo-600 font-bold text-sm">
                    <span>Retomar</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Medical Areas Grid */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <BookOpen size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Estudo por Área Médica</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {themes.map((area) => (
            <div 
              key={area.name}
              onClick={() => router.push(`/fase1/simulado?theme=${area.name}`)}
              className={`p-6 rounded-2xl border ${area.color} flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] transition-all group h-full relative overflow-hidden`}
            >
              <div className="mb-3 transform group-hover:scale-110 transition-transform">
                {area.icon}
              </div>
              <span className="font-bold text-xs uppercase tracking-tight leading-tight">{area.name}</span>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>

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
