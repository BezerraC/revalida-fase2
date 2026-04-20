"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [mode, setMode] = useState("treino"); // "treino" (feedback imediato) ou "simulado" (ao fim)

  const handleStart = () => {
    let url = `/fase1/simulado/questoes?mode=${mode}`;
    if (examId !== "all") url += `&exam_id=${examId}`;
    if (theme !== "all") url += `&theme=${theme}`;
    router.push(url);
  };

  const exams = [
    { id: "all", label: "Todas as Provas", year: "2025" },
    { id: "2025_1", label: "2025 - 1ª Edição", year: "2025" },
    { id: "2025_2", label: "2025 - 2ª Edição (Ledor)", year: "2025" },
  ];

  const themes = [
    { id: "all", label: "Todos os Temas" },
    { id: "Clínica Médica", label: "Clínica Médica" },
    { id: "Cirurgia Geral", label: "Cirurgia Geral" },
    { id: "Pediatria", label: "Pediatria" },
    { id: "Ginecologia e Obstetrícia", label: "Ginecologia e Obstetrícia" },
    { id: "Medicina Preventiva e Social", label: "Medicina Preventiva" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Top Header */}
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

            <div className="grid md:grid-cols-2 gap-10">
              
              {/* Seleção de Prova */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Selecionar Prova
                 </label>
                 <div className="space-y-2">
                    {exams.map(e => (
                      <button 
                        key={e.id}
                        onClick={() => setExamId(e.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          examId === e.id 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100" 
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                         <span className="font-bold">{e.label}</span>
                         {examId === e.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                 </div>
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
                 >
                    {themes.map(t => (
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
                <span className="text-xs font-black uppercase tracking-widest">Sem Limite de Tempo</span>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Baseado no Inep 2025</span>
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
