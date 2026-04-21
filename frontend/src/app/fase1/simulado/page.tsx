"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { 
  Target, 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Filter, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

function SimuladoConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Opções de configuração
  const [examId, setExamId] = useState(searchParams.get("exam_id") || "all");
  const [theme, setTheme] = useState(searchParams.get("theme") || "all");
  const [mode, setMode] = useState("treino");
  const [timeLimit, setTimeLimit] = useState("free"); // "free" ou "4h"
  const [availableExams, setAvailableExams] = useState<{id: string, label: string}[]>([]);
  const [availableThemes, setAvailableThemes] = useState<{id: string, label: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Forçar 4h se o modo for simulado
  useEffect(() => {
    if (mode === "simulado") {
      setTimeLimit("4h");
    }
  }, [mode]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [examsRes, themesRes] = await Promise.all([
          api.get("/exams"),
          api.get("/themes")
        ]);

        // Formatar Provas
        const examIds = examsRes.data as string[];
        const formattedExams = examIds.map(id => {
          let label = id;
          if (id.includes("_1")) label = id.replace("_1", " - 1ª Edição");
          if (id.includes("_2")) label = id.replace("_2", " - 2ª Edição");
          return { id, label };
        });
        setAvailableExams([{ id: "all", label: "Todas as Provas" }, ...formattedExams]);

        // Formatar Temas
        const themeNames = themesRes.data as string[];
        const formattedThemes = themeNames.map(name => ({ id: name, label: name }));
        setAvailableThemes([{ id: "all", label: "Todos os Temas" }, ...formattedThemes]);

      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await api.post("/simulado/sessions", {
        exam_id: examId !== "all" ? examId : null,
        theme: theme !== "all" ? theme : null,
        mode,
        time_limit: timeLimit
      });
      
      const sessionId = res.data.session_id;
      let url = `/fase1/simulado/questoes?session_id=${sessionId}&mode=${mode}&time_limit=${timeLimit}`;
      if (examId !== "all") url += `&exam_id=${examId}`;
      if (theme !== "all") url += `&theme=${theme}`;
      router.push(url);
    } catch (err) {
      console.error("Erro ao iniciar sessão de simulado:", err);
      alert("Erro ao iniciar o simulado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      
      <div className="max-w-4xl w-full space-y-8">
        
        <div className="flex items-center justify-between">
           <button 
            onClick={() => router.push("/fase1")}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors"
           >
             <ChevronLeft className="w-5 h-5" />
             Voltar ao Menu
           </button>
           <div className="p-2 bg-slate-200 rounded-lg">
             <Filter className="w-5 h-5 text-slate-500" />
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
          
          <div className="p-10 md:p-14 space-y-12">
            
            <div className="text-center space-y-3">
               <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10" />
               </div>
               <h1 className="text-4xl font-black text-slate-900">Configurar Simulado</h1>
               <p className="text-slate-500 font-medium">Personalize sua experiência de treino para a Fase 1.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start">
              
              {/* Seleção de Prova */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Selecionar Prova
                 </label>
                 
                 {loading ? (
                    <div className="flex items-center gap-3 p-8 text-slate-400 font-bold">
                       <div className="w-4 h-4 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                       Carregando provas...
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableExams.map(e => (
                          <button 
                            key={e.id}
                            onClick={() => setExamId(e.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                              examId === e.id 
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100" 
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                            } ${e.id === "all" ? "sm:col-span-2" : ""}`}
                          >
                             <span className="text-xs font-bold">{e.label}</span>
                             {examId === e.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                          </button>
                        ))}
                    </div>
                 )}
              </div>

              {/* Seleção de Tema */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Grande Área
                 </label>
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    disabled={loading}
                 >
                    {availableThemes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                 </select>

                 <div className="pt-8 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modo de Estudo</label>
                    <div className="flex p-2 bg-slate-100 rounded-2xl gap-2">
                       <button 
                        onClick={() => setMode("treino")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "treino" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                       >
                         Treino
                       </button>
                       <button 
                        onClick={() => setMode("simulado")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "simulado" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                       >
                         Simulado
                       </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold text-center italic">
                      {mode === "treino" ? "Feedback imediato após cada resposta." : "Resultados exibidos apenas no final."}
                    </p>
                 </div>

                 <div className="pt-4 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo da Prova</label>
                    <div className="flex p-2 bg-slate-100 rounded-2xl gap-2">
                       <button 
                        onClick={() => setTimeLimit("free")}
                        disabled={mode === "simulado"}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${timeLimit === "free" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"} ${mode === "simulado" ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         Tempo Livre
                       </button>
                       <button 
                        onClick={() => setTimeLimit("4h")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${timeLimit === "4h" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                       >
                         Até 4 Horas
                       </button>
                    </div>
                    {mode === "simulado" && (
                       <p className="text-[9px] text-indigo-500 font-black text-center uppercase tracking-tighter">
                         Obrigatório 4h no modo Simulado
                       </p>
                    )}
                 </div>
              </div>

            </div>

            <button 
              onClick={handleStart}
              className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 group"
            >
              Começar Simulado
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform text-indigo-400" />
            </button>

          </div>

          {/* Footer Info */}
          <div className="bg-slate-50 p-6 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-slate-100">
             <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">
                   {timeLimit === "free" ? "Sem Limite de Tempo" : "Limite de 4 Horas"}
                </span>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Baseado no Revalida</span>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function SimuladoConfigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <SimuladoConfigContent />
    </Suspense>
  );
}
