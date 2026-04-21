"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  FileText, 
  ArrowRight, 
  BookOpen, 
  Target, 
  Activity, 
  ChevronRight,
  Plus,
  Clock,
  Play
} from "lucide-react";
import api from "@/lib/api";

interface SimuladoSession {
    _id: string;
    exam_id?: string;
    theme?: string;
    answers: Record<string, string>;
    current_index: int;
    created_at: string;
    mode: string;
    time_limit: string;
}

export default function Fase1Menu() {
  const router = useRouter();
  const [themes, setThemes] = useState<{name: string, color: string}[]>([]);
  const [activeSessions, setActiveSessions] = useState<SimuladoSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [themesRes, sessionsRes] = await Promise.all([
            api.get("/themes"),
            api.get("/simulado/active")
        ]);

        const themeNames = themesRes.data as string[];
        const colors = [
          "bg-blue-50 text-blue-700",
          "bg-orange-50 text-orange-700",
          "bg-pink-50 text-pink-700",
          "bg-purple-50 text-purple-700",
          "bg-emerald-50 text-emerald-700"
        ];

        setThemes(themeNames.map((name, index) => ({
          name,
          color: colors[index % colors.length]
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Fase 1: Objetiva</h1>
            <p className="text-xl text-slate-500 font-medium">Treinamento avançado para a prova teórica do Revalida.</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Progresso</p>
              <p className="text-lg font-black text-slate-800">45% Concluído</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Simulados Ativos */}
        {!loadingSessions && activeSessions.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-700">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-indigo-500" />
                    Continuar de onde parou
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map((session) => {
                        const answered = Object.keys(session.answers || {}).length;
                        return (
                            <div 
                                key={session._id}
                                onClick={() => handleResume(session)}
                                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 cursor-pointer hover:scale-[1.02] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {session.mode}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-slate-900 text-lg">
                                        {session.exam_id ? session.exam_id.replace('_', ' ') : session.theme}
                                    </h4>
                                    <p className="text-sm text-slate-400 font-bold">
                                        {answered > 0 ? `${answered} questões respondidas` : 'Iniciado agora'}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                                        Retomar <Play className="w-3 h-3 fill-current" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <div 
            onClick={handleStartTutor}
            className="group relative bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 cursor-pointer overflow-hidden hover:scale-[1.02] transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-32 translate-x-32 group-hover:scale-110 transition-transform duration-700 opacity-60" />
            <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-200">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 leading-tight">Preceptor <br/>IA por Voz</h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                  Estudo dirigido com feedback em tempo real. Discuta temas clínicos, tire dúvidas por voz e gere mapas mentais automáticos.
                </p>
              </div>
              <div className="flex items-center gap-4 text-blue-600 font-black pt-4">
                <span className="uppercase tracking-widest text-sm">Iniciar Estudo</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push("/fase1/simulado")}
            className="group relative bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl cursor-pointer overflow-hidden hover:scale-[1.02] transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-32 translate-x-32 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg">
                <Target className="w-10 h-10 text-slate-900" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white leading-tight">Simulado <br/>Objetivo 2025</h2>
                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                  Treine com as questões reais da 1ª e 2ª edição do Revalida 2025. Filtre por tema e analise seu desempenho por área.
                </p>
              </div>
              <div className="flex items-center gap-4 text-indigo-400 font-black pt-4">
                <span className="uppercase tracking-widest text-sm">Abrir Simulado</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Areas Section */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg">
           <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-500" />
              Grandes Áreas do Revalida
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {themes.map((area) => (
                <div 
                  key={area.name}
                  onClick={() => router.push(`/fase1/simulado?theme=${area.name}`)}
                  className={`p-6 rounded-3xl ${area.color} flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-all border border-transparent hover:border-current/10 group h-full`}
                >
                  <span className="font-black text-[10px] sm:text-xs uppercase tracking-wider">{area.name}</span>
                  <Plus className="w-4 h-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
