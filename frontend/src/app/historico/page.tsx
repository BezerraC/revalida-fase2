"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FileText, ArrowRight, Activity, ArrowLeft, BookOpen, Stethoscope, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface Fase2HistoryItem {
  session_id: string;
  case_id: string;
  case_title: string;
  case_category: string;
  turns_count: number;
  has_feedback: boolean;
}

interface Fase1HistoryItem {
  session_id: string;
  title: string;
  turns_count: number;
}

interface SimuladoHistoryItem {
  session_id: string;
  title: string;
  correct_answers: number;
  total_questions: number;
  score_percentage: number;
  finished_at: string;
  mode: string;
  exam_id?: string;
  theme?: string;
  status: "active" | "finished";
  answered_count: number;
}

export default function HistoricoWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <HistoricoPage />
    </Suspense>
  );
}

function HistoricoPage() {
  const [fase2History, setFase2History] = useState<Fase2HistoryItem[]>([]);
  const [fase1History, setFase1History] = useState<Fase1HistoryItem[]>([]);
  const [simuladoHistory, setSimuladoHistory] = useState<SimuladoHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fase2" | "fase1" | "simulado">("fase2");
  const router = useRouter();
  const searchParams = useSearchParams();

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
    const tab = searchParams.get("tab") as any;
    if (tab === "fase1" || tab === "fase2" || tab === "simulado") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      
      try {
        const [res2, res1, resSim] = await Promise.all([
          api.get("/history"),
          api.get("/fase1/history"),
          api.get("/simulado/history")
        ]);
        setFase2History(res2.data.history);
        setFase1History(res1.data.history);
        setSimuladoHistory(resSim.data.history);
      } catch (err) {
        console.error("Error loading history", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, []);

  const handleDeleteFase2 = (sessionId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Excluir Simulação",
      message: "Tem certeza que deseja apagar este registro de simulação prática? Esta ação é permanente.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/sessions/${sessionId}`);
          setFase2History(fase2History.filter(h => h.session_id !== sessionId));
        } catch (err) {
          console.error("Erro ao excluir", err);
        }
      }
    });
  };

  const handleDeleteFase1 = (sessionId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Excluir Tutoria",
      message: "Tem certeza que deseja apagar este registro de tutoria teórica?",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/fase1/sessions/${sessionId}`);
          setFase1History(fase1History.filter(h => h.session_id !== sessionId));
        } catch (err) {
          console.error("Erro ao excluir", err);
        }
      }
    });
  };

  const handleDeleteSimulado = (sessionId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Excluir Resultado",
      message: "Tem certeza que deseja apagar este resultado de simulado? Seus pontos não serão removidos, mas o registro sumirá do histórico.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/simulado/sessions/${sessionId}`);
          setSimuladoHistory(simuladoHistory.filter(h => h.session_id !== sessionId));
        } catch (err) {
          console.error("Erro ao excluir", err);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <button 
             onClick={() => router.push("/")}
             className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-all group"
          >
             <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
             Voltar ao Dashboard
          </button>
          <div className="flex items-center gap-6">
             <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100 shrink-0">
                <FileText className="w-8 h-8 text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Histórico de Atividades</h1>
                <p className="text-slate-500 mt-1 font-medium">Acompanhe seu progresso e revise seu desempenho.</p>
             </div>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex space-x-2 p-1.5 bg-slate-200/50 rounded-[1.5rem] mb-10">
            <button
               onClick={() => setActiveTab("fase2")}
               className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-black text-sm uppercase tracking-widest rounded-2xl transition-all ${
                   activeTab === "fase2" 
                      ? "bg-white text-emerald-600 shadow-xl shadow-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
               }`}
            >
               <Stethoscope className="w-5 h-5" /> Prática (Fase 2)
            </button>
            <button
               onClick={() => setActiveTab("simulado")}
               className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-black text-sm uppercase tracking-widest rounded-2xl transition-all ${
                   activeTab === "simulado" 
                      ? "bg-white text-indigo-600 shadow-xl shadow-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
               }`}
            >
               <BookOpen className="w-5 h-5" /> Questões (Fase 1)
            </button>
            <button
               onClick={() => setActiveTab("fase1")}
               className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-black text-sm uppercase tracking-widest rounded-2xl transition-all ${
                   activeTab === "fase1" 
                      ? "bg-white text-violet-600 shadow-xl shadow-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
               }`}
            >
               <Activity className="w-5 h-5" /> Tutorias (Fase 1)
            </button>
        </div>

        {loading ? (
           <div className="flex justify-center py-20">
             <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
           </div>
        ) : activeTab === "fase2" ? (
            /* FASE 2 LIST */
            fase2History.length === 0 ? (
               <div className="text-center py-24 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Stethoscope className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhuma simulação prática encontrada</h3>
               </div>
            ) : (
               <div className="flex flex-col gap-5 animate-in">
                  {fase2History.map(item => (
                     <div key={item.session_id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 space-y-3">
                           <div className="flex items-center gap-3">
                              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-emerald-100">{item.case_category}</span>
                              {item.has_feedback ? (
                                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-indigo-100">Relatório Pronto</span>
                              ) : (
                                 <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-amber-100">Análise Pendente</span>
                              )}
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 tracking-tight">{item.case_title}</h3>
                           <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                              <span>Interações: {Math.floor(item.turns_count / 2)}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center shrink-0 gap-4 w-full md:w-auto">
                           <button 
                             onClick={() => handleDeleteFase2(item.session_id)}
                             className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                             title="Excluir"
                           >
                             <Trash2 size={22} />
                           </button>
                           <button onClick={() => router.push(`/feedback/${item.session_id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200">
                               Ver Desempenho <ArrowRight className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
        ) : activeTab === "simulado" ? (
            /* SIMULADO LIST */
            simuladoHistory.length === 0 ? (
               <div className="text-center py-24 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum simulado concluído</h3>
               </div>
            ) : (
               <div className="flex flex-col gap-5 animate-in">
                  {simuladoHistory.map(item => (
                     <div key={item.session_id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 space-y-3">
                           <div className="flex items-center gap-3">
                              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-indigo-100">Fase 1</span>
                              {item.status === "finished" ? (
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                                  item.score_percentage >= 70 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  item.score_percentage >= 50 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-600 border-red-100"
                                }`}>
                                  {item.score_percentage}% Acertos
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-amber-100 animate-pulse">
                                  Em Andamento
                                </span>
                              )}
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 tracking-tight">{item.title}</h3>
                           <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                              {item.status === "finished" ? (
                                <span>{item.correct_answers} de {item.total_questions} questões</span>
                              ) : (
                                <span>{item.answered_count} questões respondidas</span>
                              )}
                              <span>•</span>
                              <span>Modo {item.mode === "treino" ? "Treino" : "Exame"}</span>
                              <span>•</span>
                              <span>{new Date(item.finished_at).toLocaleDateString('pt-BR')}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center shrink-0 gap-4 w-full md:w-auto">
                           <button 
                             onClick={() => handleDeleteSimulado(item.session_id)}
                             className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                             title="Excluir"
                           >
                             <Trash2 size={22} />
                           </button>
                           <button 
                             onClick={() => {
                               if (item.status === "finished") {
                                 router.push(`/fase1/simulado/questoes?session_id=${item.session_id}`);
                               } else {
                                 let url = `/fase1/simulado/questoes?session_id=${item.session_id}&mode=${item.mode}`;
                                 if (item.exam_id) url += `&exam_id=${item.exam_id}`;
                                 if (item.theme) url += `&theme=${item.theme}`;
                                 router.push(url);
                               }
                             }} 
                             className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-black px-8 py-4 rounded-2xl transition-all shadow-lg ${
                               item.status === "finished" 
                                 ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100" 
                                 : "bg-slate-900 text-white hover:bg-black shadow-slate-200"
                             }`}
                           >
                               {item.status === "finished" ? "Ver Resultados" : "Retomar Simulado"} 
                               <ArrowRight className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
        ) : (
            /* FASE 1 CHAT LIST */
            fase1History.length === 0 ? (
               <div className="text-center py-24 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhuma tutoria iniciada</h3>
               </div>
            ) : (
               <div className="flex flex-col gap-5 animate-in">
                  {fase1History.map(item => (
                     <div key={item.session_id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 space-y-3">
                           <div className="flex items-center gap-3">
                              <span className="bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-violet-100">Preceptor IA</span>
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 tracking-tight line-clamp-1">{item.title}</h3>
                           <p className="text-slate-400 text-sm font-medium">Interações: {Math.floor(item.turns_count / 2)}</p>
                        </div>
                        
                        <div className="flex items-center shrink-0 gap-4 w-full md:w-auto">
                           <button 
                             onClick={() => handleDeleteFase1(item.session_id)}
                             className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                             title="Excluir"
                           >
                             <Trash2 size={22} />
                           </button>
                           <button onClick={() => router.push(`/fase1/${item.session_id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-violet-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-100">
                               Abrir Lousa <ArrowRight className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
        )}
      </div>

      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        confirmText="Confirmar Exclusão"
        cancelText="Voltar"
      />
    </div>
  );
}
