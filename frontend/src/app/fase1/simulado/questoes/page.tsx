"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Flag,
  ArrowRight,
  Trophy,
  RefreshCw,
  Home,
  LogOut,
  Filter,
  Save
} from "lucide-react";
import api, { BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Question {
  _id: string;
  exam_id: string;
  number: number;
  text: string;
  alternatives: Record<string, string>;
  correct_answer: string;
  theme: string;
  images: string[];
  metadata?: {
    area: string;
    specialty: string;
    topic: string;
    focus: string[];
  };
  explanation?: {
    context: string;
    alternatives: Record<string, string>;
    annulled_reason: string | null;
  };
}

function ActiveSimuladoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sessionId = searchParams.get("session_id");
  const mode = searchParams.get("mode") || "treino";
  const examId = searchParams.get("exam_id");
  const theme = searchParams.get("theme");
  const topic = searchParams.get("topic");
  const focus = searchParams.get("focus");
  const timeLimit = searchParams.get("time_limit"); // "free" ou "4h"

  const { refreshUser } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Timer States
  const [elapsed, setElapsed] = useState(0); 
  const [remaining, setRemaining] = useState(timeLimit === "4h" ? 14400 : 0); 
  
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Função para limpar e formatar o texto das questões
  const formatText = (text: string) => {
    if (!text) return "";
    return text
      // 1. Remove múltiplos espaços e normaliza espaços em branco
      .replace(/\s{2,}/g, " ")
      // 2. Garante espaço após pontuação (.;?!:) se não for seguido por espaço, aspas ou dígito
      .replace(/([.;?!:])([^\s"'\d])/g, "$1 $2")
      // 3. Garante espaço após vírgula se não for entre dígitos
      .replace(/,([^\s\d])/g, ", $1")
      // 4. Remove espaços antes de pontuação
      .replace(/\s+([,.;?!:])/g, "$1")
      // 5. Espaçamento de Parênteses
      .replace(/([^\s(\[])\(/g, "$1 (") // Espaço antes de (
      .replace(/\(\s+/g, "(") // Sem espaço após (
      .replace(/\s+\)/g, ")") // Sem espaço antes de )
      .replace(/\)([^\s).,;?!:])/g, ") $1") // Espaço após )
      // 6. Unidades de Medida (ex: 10mg -> 10 mg, 5mcg -> 5 mcg)
      .replace(/(\d+)(mg|kg|mcg|ml|cm|mm|g|h|min|UI|bpm|irpm|mmHg)\b/gi, "$1 $2")
      // 7. Normaliza quebras de linha
      .replace(/\n\s*\n/g, "\n\n")
      // 8. Correção de encoding comum (caso apareçam no front)
      .replace(/mǸdica/g, "médica")
      .replace(/avaliaǜo/g, "avaliação")
      .trim();
  };

  // Função para salvar progresso no backend
  const saveProgress = useCallback(async (currentAnswers: any, index: number, timeElapsed: number, finished: boolean = false) => {
    if (!sessionId) return;
    try {
      await api.patch(`/simulado/sessions/${sessionId}`, {
        answers: currentAnswers,
        current_index: index,
        elapsed_time: timeElapsed
      });
    } catch (err) {
      console.error("Erro ao salvar progresso:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchQuestions();
      
      // Se tiver session_id, carregar dados salvos
      if (sessionId) {
        try {
          const sessionRes = await api.get(`/simulado/sessions/${sessionId}`);
          const session = sessionRes.data;
          setAnswers(session.answers || {});
          setCurrentIndex(session.current_index || 0);
          setElapsed(session.elapsed_time || 0);
          if (timeLimit === "4h") {
            setRemaining(14400 - (session.elapsed_time || 0));
          }
          if (session.status === "finished") {
             setFinalResult(session.result);
             setShowResults(true);
             setIsTimerRunning(false);
          }
        } catch (err) {
          console.error("Erro ao carregar sessão:", err);
        }
      }
      setLoading(false);
    }
    init();
  }, [sessionId, timeLimit]);

  useEffect(() => {
    if (!isTimerRunning || loading) return;

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);

      if (timeLimit === "4h") {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            finishSimulado();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLimit, loading]);

  async function fetchQuestions() {
    try {
      let url = "/questions";
      const params = new URLSearchParams();
      if (examId) params.append("exam_id", examId);
      if (theme) params.append("theme", theme);
      if (topic) params.append("topic", topic);
      if (focus) params.append("focus", focus);
      if (sessionId) params.append("session_id", sessionId);
      
      const res = await api.get(`${url}?${params.toString()}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Erro ao carregar questões:", err);
    }
  }

  const handleSelect = (letter: string) => {
    if (showResults) return;
    if (mode === "treino" && answers[currentIndex]) return; 

    const newAnswers = { ...answers, [currentIndex]: letter };
    setAnswers(newAnswers);
    saveProgress(newAnswers, currentIndex, elapsed);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      saveProgress(answers, nextIdx, elapsed);
    } else {
      finishSimulado();
    }
  };

  const [finalResult, setFinalResult] = useState<any>(null);

  const finishSimulado = async () => {
    try {
      setIsTimerRunning(false);
      setLoading(true);
      // Salvar progresso uma última vez com o tempo final
      await saveProgress(answers, currentIndex, elapsed, true);
      
      const res = await api.post(`/simulado/sessions/${sessionId}/finish`);
      setFinalResult(res.data.result);
      setShowResults(true);
      await refreshUser();
    } catch (err) {
      console.error("Erro ao finalizar simulado:", err);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${min < 10 ? "0" : ""}${min}:${sec < 10 ? "0" : ""}${sec}`;
    }
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Preparando Experiência</p>
          <p className="text-slate-400 text-sm font-medium">Configurando seu simulado personalizado...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 border border-slate-100">
            <HelpCircle className="w-12 h-12 text-slate-300" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Nenhuma questão encontrada</h2>
          <p className="text-slate-500 max-w-sm mb-10 font-medium">Os filtros selecionados não retornaram resultados. Tente escolher outras áreas ou anos.</p>
          <button 
            onClick={() => router.push("/fase1/simulado")} 
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-slate-200 hover:scale-105 transition-transform"
          >
            Ajustar Filtros
          </button>
       </div>
    );
  }

  if (showResults) {
    const hits = questions.filter((q, i) => {
      const isCorrect = answers[i] === q.correct_answer;
      const isAnnulled = q.correct_answer === "Anulada";
      return isCorrect || isAnnulled;
    }).length;
    const total = questions.length;
    const percent = Math.round((hits / total) * 100);

    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 lg:p-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="relative overflow-hidden bg-white rounded-[3.5rem] p-12 lg:p-16 border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
             
             <div className="relative flex flex-col items-center text-center space-y-10">
               <div className="relative">
                 <div className="w-28 h-28 bg-yellow-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-yellow-200 rotate-3 transform transition-transform hover:rotate-0">
                    <Trophy className="w-14 h-14 text-white" />
                 </div>
                 <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                 </div>
               </div>

               <div className="space-y-3">
                  <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">Desempenho Final</h1>
                  <p className="text-slate-500 font-medium text-lg lg:text-xl max-w-xl mx-auto leading-relaxed">
                    Você concluiu o simulado! Analise suas métricas e identifique pontos de melhoria para o Revalida.
                  </p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                  <div className="bg-slate-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Acertos</p>
                     <div className="flex items-baseline gap-1 justify-center">
                        <span className="text-4xl font-black text-emerald-600">{hits}</span>
                        <span className="text-slate-300 font-bold">/ {total}</span>
                     </div>
                  </div>
                  <div className="bg-slate-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Precisão</p>
                     <span className="text-4xl font-black text-indigo-600">{percent}%</span>
                  </div>
                  <div className="bg-slate-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tempo Total</p>
                     <span className="text-4xl font-black text-slate-800 tabular-nums">{formatTime(elapsed)}</span>
                  </div>
               </div>

               <div className="flex flex-wrap justify-center gap-4 pt-6">
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
                  >
                    <RefreshCw className="w-5 h-5" /> Tentar Novamente
                  </button>
                  <button 
                    onClick={() => router.push("/fase1")}
                    className="px-10 py-5 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all"
                  >
                    <Home className="w-5 h-5" /> Voltar ao Menu
                  </button>
               </div>
             </div>
          </div>

           {finalResult && finalResult.theme_metrics && (
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Desempenho por Área</h3>
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest">
                    Métricas Detalhadas
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {Object.entries(finalResult.theme_metrics).map(([theme, data]: [string, any]) => {
                      const themePercent = Math.round((data.correct / data.total) * 100);
                      const isHigh = themePercent >= 70;
                      const isMid = themePercent >= 50;

                      return (
                        <div key={theme} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6">
                           <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-black text-slate-800 text-sm leading-tight uppercase tracking-tight line-clamp-2">{theme}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                  {data.correct} de {data.total} questões
                                </p>
                              </div>
                              <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                                isHigh ? "bg-emerald-50 text-emerald-600" : 
                                isMid ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                              }`}>
                                {themePercent}%
                              </span>
                           </div>
                           
                           <div className="space-y-3">
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full transition-all duration-1000 ease-out group-hover:opacity-80 ${
                                     isHigh ? "bg-emerald-500" : isMid ? "bg-amber-500" : "bg-red-500"
                                   }`}
                                   style={{ width: `${themePercent}%` }}
                                 />
                              </div>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
                                <span>0%</span>
                                <span>100%</span>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
           )}

          <div className="space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revisão Completa</h3>
               <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                    <CheckCircle2 className="w-3 h-3" /> {hits}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase">
                    <XCircle className="w-3 h-3" /> {total - hits}
                  </div>
               </div>
             </div>
             
             <div className="grid gap-4">
                {questions.map((q, i) => {
                   const isAnswerCorrect = answers[i] === q.correct_answer;
                   const isAnnulled = q.correct_answer === "Anulada";
                   
                   return (
                    <div key={i} className={`group p-6 rounded-[2rem] border transition-all hover:shadow-md ${
                      (isAnswerCorrect || isAnnulled) ? "bg-white border-slate-100" : "bg-red-50/30 border-red-100/50"
                    }`}>
                       <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg ${
                            isAnnulled ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : 
                            (isAnswerCorrect ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-red-500 text-white shadow-lg shadow-red-100")
                          }`}>
                             {q.number || i+1}
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                             <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {q.theme}
                                </span>
                                {isAnnulled && (
                                   <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md uppercase">Anulada</span>
                                )}
                             </div>
                             <p className="font-bold text-slate-800 text-sm md:text-base leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                                {formatText(q.text)}
                             </p>
                          </div>

                          <div className="flex items-center gap-8 shrink-0 md:border-l border-slate-100 md:pl-8">
                             <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Gabarito</p>
                                <span className="w-8 h-8 inline-flex items-center justify-center bg-slate-100 rounded-lg font-black text-slate-800">
                                  {q.correct_answer}
                                </span>
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Sua Escolha</p>
                                <span className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-black ${
                                  isAnnulled ? "bg-amber-100 text-amber-700" : (isAnswerCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")
                                }`}>
                                   {answers[i] || "-"}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                   );
                })}
             </div>
          </div>

        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selected = answers[currentIndex];
  const isCorrect = selected === currentQ.correct_answer;
  const showFeedback = mode === "treino" && selected;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowExitModal(false)} />
          <div className="relative bg-white rounded-[3rem] p-12 max-w-md w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-white animate-in zoom-in-95 duration-300 space-y-10">
            <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500">
               <LogOut className="w-12 h-12" />
            </div>
            <div className="text-center space-y-3">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pausar Simulado?</h3>
               <p className="text-slate-500 font-medium leading-relaxed">
                 Seu progresso será salvo. Você poderá continuar exatamente de onde parou a qualquer momento.
               </p>
            </div>
            <div className="grid gap-4">
               <button 
                 onClick={async () => {
                   await saveProgress(answers, currentIndex, elapsed);
                   router.push("/fase1");
                 }} 
                 className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
               >
                 <Save className="w-5 h-5" /> Salvar e Sair
               </button>
               <button 
                 onClick={() => setShowExitModal(false)}
                 className="w-full bg-white text-slate-500 py-5 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 transition-all"
               >
                 Continuar Treinando
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowExitModal(true)}
              className="group p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-900" />
            </button>
            <div className="hidden sm:block h-10 w-px bg-slate-100" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progresso do Simulado</p>
              <h2 className="font-black text-slate-900 tracking-tight text-lg">
                Questão <span className="text-indigo-600">{currentIndex + 1}</span> de {questions.length}
              </h2>
            </div>
         </div>

         <div className="flex items-center gap-8 lg:gap-16">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-[1.25rem] border transition-all duration-500 ${
              timeLimit === "4h" && remaining < 300 
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse shadow-lg shadow-red-100" 
                : "bg-slate-50 border-slate-100 text-slate-800"
            }`}>
               <Timer className={`w-5 h-5 ${timeLimit === "4h" && remaining < 300 ? "text-red-500" : "text-indigo-500"}`} />
               <span className="font-black tabular-nums tracking-wider text-sm lg:text-base">
                 {timeLimit === "4h" ? formatTime(remaining) : formatTime(elapsed)}
               </span>
            </div>
            
            <div className="hidden lg:block w-64 bg-slate-100 h-2.5 rounded-full overflow-hidden p-[2px]">
               <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(79,70,229,0.4)]" 
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
               />
            </div>
         </div>
      </div>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-6 md:p-12 lg:p-20 grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-20">
          
          {/* Question Body */}
          <div className="space-y-12">
             <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                   <div className="px-4 py-1.5 bg-white border border-slate-200 shadow-sm rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                      {currentQ.theme}
                   </div>
                   <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] font-black text-indigo-600 uppercase tracking-[0.15em]">
                      {currentQ.exam_id.replace('_', ' ')}
                   </div>
                   {currentQ.correct_answer === "Anulada" && (
                      <div className="px-4 py-1.5 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] animate-pulse shadow-lg shadow-amber-100">
                         Questão Anulada
                      </div>
                   )}
                </div>
                
                <div className="relative group">
                  <div className="absolute -left-6 top-0 bottom-0 w-1 bg-indigo-600/20 rounded-full group-hover:bg-indigo-600 transition-colors" />
                  <p className="text-xl md:text-2xl font-bold text-slate-800 leading-[1.6] whitespace-pre-wrap tracking-tight">
                     {formatText(currentQ.text)}
                  </p>
                </div>
             </div>

             {/* Images Area */}
             {currentQ.images && currentQ.images.length > 0 && (
                <div className="flex flex-col gap-8 bg-white p-2 rounded-[1rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                   {currentQ.images.map((img, idx) => (
                      <div key={idx} className="relative w-full bg-slate-50 rounded-[.8rem] overflow-hidden group border border-slate-100 shadow-inner">
                         <img 
                          src={`${BASE_URL}/${img}`} 
                          alt={`Questão ${currentQ.number} - Imagem ${idx + 1}`}
                          className="w-full h-auto object-contain cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-700"
                          onClick={() => setZoomImage(`${BASE_URL}/${img}`)}
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />
                         {/* <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            Clique para Ampliar
                         </div> */}
                      </div>
                   ))}
                </div>
             )}

             {/* Alternatives */}
             <div className="grid gap-5">
                {Object.entries(currentQ.alternatives).map(([letter, text]) => {
                    const isSelected = selected === letter;
                    const isCorrectChoice = letter === currentQ.correct_answer;
                    const isAnnulled = currentQ.correct_answer === "Anulada";
                    
                    let variantClass = "bg-white border-slate-100 text-slate-800 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:-translate-y-0.5";
                    if (isSelected) {
                       if (isAnnulled) {
                          variantClass = "bg-amber-100 border-amber-300 text-amber-800 shadow-lg shadow-amber-100";
                       } else if (showFeedback) {
                          variantClass = isCorrectChoice 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200" 
                            : "bg-red-600 border-red-600 text-white shadow-xl shadow-red-200";
                       } else {
                          variantClass = "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-y-1";
                       }
                    } else if (showFeedback && isCorrectChoice) {
                       variantClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
                    }

                   return (
                      <button 
                        key={letter}
                        onClick={() => handleSelect(letter)}
                        className={`w-full text-left p-6 md:p-8 rounded-[2.25rem] border-2 transition-all duration-300 flex gap-8 items-start group relative ${variantClass}`}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all ${
                            isSelected 
                              ? "bg-white/20 text-white" 
                              : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                         }`}>
                            {letter}
                         </div>
                         <div className={`flex-1 pt-2.5 font-bold text-base md:text-lg leading-relaxed tracking-tight transition-colors duration-300`}>
                            {formatText(text)}
                         </div>
                         {showFeedback && isCorrectChoice && (
                            <div className={`p-2 rounded-full shrink-0 ${isSelected ? "bg-white/20" : "bg-emerald-100"}`}>
                               <CheckCircle2 className={`w-6 h-6 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                            </div>
                         )}
                         {showFeedback && isSelected && !isCorrectChoice && (
                            <div className="p-2 bg-white/20 rounded-full shrink-0">
                               <XCircle className="w-6 h-6 text-white" />
                            </div>
                         )}
                      </button>
                   );
                })}
             </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8 lg:sticky lg:top-[120px] h-fit self-start">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-8">
                <div className="space-y-2">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                      <Flag className="w-4 h-4 text-indigo-500" /> Detalhes da Questão
                   </h3>
                   <div className="h-1 w-12 bg-indigo-600 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>
                
                <div className="space-y-5">
                   <div className="flex items-center justify-between py-4 border-b border-slate-50 group">
                      <span className="text-slate-400 font-bold text-sm">Respondidas</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">{Object.keys(answers).length}</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-black text-slate-400">{questions.length}</span>
                      </div>
                   </div>
                   <div className="flex items-center justify-between py-4 border-b border-slate-50">
                      <span className="text-slate-400 font-bold text-sm">Área Clínica</span>
                      <span className="font-black text-indigo-600 text-sm uppercase tracking-tight">{currentQ.theme}</span>
                   </div>
                   <div className="flex items-center justify-between py-3">
                      <span className="text-slate-400 font-bold text-sm">Origem</span>
                      <span className="font-black text-slate-800">{currentQ.exam_id.replace('_', ' ')}</span>
                   </div>
                </div>

                <div className="pt-6">
                   <button 
                    onClick={handleNext}
                    disabled={!selected}
                    className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-2xl font-black flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all duration-500 group shadow-2xl shadow-slate-200 active:scale-95"
                   >
                     <span className="text-base">
                       {currentIndex === questions.length - 1 ? "Finalizar Simulado" : "Próxima Questão"}
                     </span>
                     <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                   </button>
                   <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-6">
                      Sua resposta é salva automaticamente
                   </p>
                </div>
             </div>

             {showFeedback && (
                <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                   {/* Main Feedback Card */}
                   <div className={`p-10 rounded-[3rem] border-2 shadow-xl ${
                     isCorrect ? "bg-emerald-50 border-emerald-100 shadow-emerald-50" : "bg-red-50 border-red-100 shadow-red-50"
                   }`}>
                      <div className="flex items-center gap-3 mb-6">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                           {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                         </div>
                         <div>
                            <p className={`font-black uppercase tracking-[0.2em] text-[11px] ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                               {isCorrect ? "Excelente!" : "Atenção ao Caso"}
                            </p>
                            <h4 className={`text-xl font-black ${isCorrect ? "text-emerald-900" : "text-red-900"}`}>
                               {isCorrect ? "Você acertou!" : "Não foi dessa vez"}
                            </h4>
                         </div>
                      </div>

                      {/* Clinical Context */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-md border border-slate-100">
                               Especialidade: {currentQ.metadata?.specialty || currentQ.theme}
                            </span>
                            {currentQ.metadata?.topic && (
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                  {currentQ.metadata.topic}
                               </span>
                            )}
                         </div>
                         
                         <p className={`text-base leading-relaxed font-medium ${isCorrect ? "text-emerald-800" : "text-red-800"}`}>
                            {currentQ.explanation?.context || (isCorrect 
                              ? "O raciocínio clínico aplicado está alinhado com as diretrizes oficiais." 
                              : `A resposta correta é a alternativa (${currentQ.correct_answer}).`)}
                         </p>

                         {/* Annulled Reason if applicable */}
                         {currentQ.explanation?.annulled_reason && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Motivo da Anulação</p>
                               <p className="text-sm text-amber-800 font-bold leading-relaxed">
                                  {currentQ.explanation.annulled_reason}
                               </p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Detailed Alternatives Explanation */}
                   {currentQ.explanation?.alternatives && (
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-8">
                         <div className="space-y-2">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                               <Filter className="w-4 h-4 text-indigo-500" /> Por que esta alternativa?
                            </h3>
                            <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                         </div>

                         <div className="space-y-6">
                            {Object.entries(currentQ.explanation.alternatives).map(([key, value]) => {
                               const isThisCorrect = key === currentQ.correct_answer;
                               const isUserChoice = selected === key;
                               
                               return (
                                  <div key={key} className={`space-y-2 p-4 rounded-2xl transition-all ${
                                     isThisCorrect ? "bg-emerald-50/50 border border-emerald-100" : 
                                     (isUserChoice ? "bg-red-50/50 border border-red-100" : "bg-slate-50/30")
                                  }`}>
                                     <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                           isThisCorrect ? "bg-emerald-500 text-white" : 
                                           (isUserChoice ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500")
                                        }`}>
                                           {key}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                           isThisCorrect ? "text-emerald-600" : 
                                           (isUserChoice ? "text-red-600" : "text-slate-400")
                                        }`}>
                                           {String(value).startsWith("Correta") ? "Correta" : "Incorreta"}
                                        </span>
                                     </div>
                                     <p className="text-sm font-bold text-slate-600 leading-relaxed pl-9">
                                        {String(value).replace(/^Correta\. |^Incorreta\. /, "")}
                                     </p>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   )}
                </div>
             )}
          </div>

        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-16 animate-in fade-in duration-500"
          onClick={() => setZoomImage(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all active:scale-90 z-[110]"
            onClick={(e) => {
              e.stopPropagation();
              setZoomImage(null);
            }}
          >
            <XCircle className="w-8 h-8" />
          </button>
          
          <div 
            className="relative max-w-7xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomImage} 
              alt="Zoom" 
              className="w-full h-auto object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function ActiveSimuladoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Carregando Interface...</p>
      </div>
    }>
      <ActiveSimuladoContent />
    </Suspense>
  );
}
