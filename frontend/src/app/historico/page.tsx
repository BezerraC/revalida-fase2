"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FileText, ArrowRight, Activity, ArrowLeft, BookOpen, Stethoscope } from "lucide-react";

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

export default function HistoricoWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    }>
      <HistoricoPage />
    </Suspense>
  );
}

function HistoricoPage() {
  const [fase2History, setFase2History] = useState<Fase2HistoryItem[]>([]);
  const [fase1History, setFase1History] = useState<Fase1HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fase2" | "fase1">("fase2");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "fase1" || tab === "fase2") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      
      try {
        const [res2, res1] = await Promise.all([
          api.get("/history"),
          api.get("/fase1/history")
        ]);
        setFase2History(res2.data.history);
        setFase1History(res1.data.history);
      } catch (err) {
        console.error("Error loading history", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <button 
             onClick={() => router.push("/")}
             className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors"
          >
             <ArrowLeft className="w-5 h-5" />
             Voltar para Início
          </button>
          <div className="flex items-center gap-4">
             <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200 shrink-0">
                <FileText className="w-8 h-8 text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Histórico de Atividades</h1>
                <p className="text-slate-500 mt-1 font-medium">Reveja suas simulações e tutorias teóricas passadas.</p>
             </div>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex space-x-1 p-1 bg-slate-200/60 rounded-xl mb-8">
            <button
               onClick={() => setActiveTab("fase2")}
               className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-lg transition-all ${
                   activeTab === "fase2" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
               }`}
            >
               <Stethoscope className="w-5 h-5" /> Simulados OSCE (Fase 2)
            </button>
            <button
               onClick={() => setActiveTab("fase1")}
               className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-lg transition-all ${
                   activeTab === "fase1" 
                      ? "bg-white text-blue-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
               }`}
            >
               <BookOpen className="w-5 h-5" /> Tutorias Teóricas (Fase 1)
            </button>
        </div>

        {loading ? (
           <div className="flex justify-center py-20">
             <Activity className="w-10 h-10 text-slate-400 animate-spin" />
           </div>
        ) : activeTab === "fase2" ? (
            /* FASE 2 LIST */
            fase2History.length === 0 ? (
               <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Nenhuma simulação encontrada</h3>
               </div>
            ) : (
               <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {fase2History.map(item => (
                     <div key={item.session_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{item.case_category}</span>
                              {item.has_feedback ? (
                                 <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">Feedback Gerado</span>
                              ) : (
                                 <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">Análise Pendente</span>
                              )}
                           </div>
                           <h3 className="text-xl font-bold text-slate-800 transition-colors">{item.case_title}</h3>
                           <p className="text-slate-500 text-sm mt-1">Trocas de mensagens: {Math.floor(item.turns_count / 2)}</p>
                        </div>
                        
                        <div className="flex items-center shrink-0 gap-3 w-full md:w-auto mt-4 md:mt-0">
                           <button onClick={() => router.push(`/simulacao/${item.session_id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm">
                              Ver/Continuar Consulta
                           </button>
                           <button onClick={() => router.push(`/feedback/${item.session_id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-sm">
                              Ler Relatório <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
        ) : (
            /* FASE 1 LIST */
            fase1History.length === 0 ? (
               <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Nenhuma tutoria encontrada</h3>
               </div>
            ) : (
               <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {fase1History.map(item => (
                     <div key={item.session_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">Tutoria Teórica</span>
                           </div>
                           <h3 className="text-xl font-bold text-slate-800 transition-colors line-clamp-2 max-w-full lg:max-w-[400px]">{item.title}</h3>
                           <p className="text-slate-500 text-sm mt-1">Trocas de mensagens: {Math.floor(item.turns_count / 2)}</p>
                        </div>
                        
                        <div className="flex items-center shrink-0 w-full md:w-auto mt-4 md:mt-0">
                           <button onClick={() => router.push(`/fase1/${item.session_id}`)} className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm">
                              Reabrir Lousa <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
        )}
      </div>
    </div>
  );
}
