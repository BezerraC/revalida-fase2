"use client";

import { useEffect, useState, Suspense } from "react";
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
  Home
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  _id: string;
  exam_id: string;
  number: number;
  text: string;
  alternatives: Record<string, string>;
  correct_answer: string;
  theme: string;
  images: string[];
}

function ActiveSimuladoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get("mode") || "treino";
  const examId = searchParams.get("exam_id");
  const theme = searchParams.get("theme");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchQuestions() {
    try {
      let url = "/questions";
      const params = new URLSearchParams();
      if (examId) params.append("exam_id", examId);
      if (theme) params.append("theme", theme);
      
      const res = await api.get(`${url}?${params.toString()}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Erro ao carregar questões:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelect = (letter: string) => {
    if (showResults) return;
    if (mode === "treino" && answers[currentIndex]) return; // Já respondeu no modo treino

    setAnswers({ ...answers, [currentIndex]: letter });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Preparando Prova...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <HelpCircle className="w-20 h-20 text-slate-300 mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Nenhuma questão encontrada</h2>
          <p className="text-slate-500 mb-8">Tente ajustar os filtros do seu simulado.</p>
          <button onClick={() => router.push("/fase1/simulado")} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Voltar</button>
       </div>
    );
  }

  if (showResults) {
    const hits = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    const total = questions.length;
    const percent = Math.round((hits / total) * 100);

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in slide-in-from-bottom-8 duration-700">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-100 shadow-2xl space-y-8">
             <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-200">
                <Trophy className="w-12 h-12 text-white" />
             </div>
             <div className="space-y-2">
                <h1 className="text-5xl font-black text-slate-900">Resultado Final</h1>
                <p className="text-slate-500 font-medium text-lg">Excelente esforço! Confira seu desempenho detalhado.</p>
             </div>

             <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acertos</p>
                   <p className="text-3xl font-black text-emerald-600">{hits}/{total}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precisão</p>
                   <p className="text-3xl font-black text-indigo-600">{percent}%</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo</p>
                   <p className="text-3xl font-black text-slate-800">{formatTime(elapsed)}</p>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                  <RefreshCw className="w-5 h-5" /> Tentar Novamente
                </button>
                <button 
                  onClick={() => router.push("/fase1")}
                  className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                >
                  <Home className="w-5 h-5" /> Voltar ao Menu
                </button>
             </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800">Revisão de Questões</h3>
             <div className="grid gap-4">
                {questions.map((q, i) => (
                   <div key={i} className={`p-6 rounded-3xl border flex items-center justify-between ${answers[i] === q.correct_answer ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${q.correct_answer === "Anulada" ? "bg-amber-500 text-white" : (answers[i] === q.correct_answer ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}`}>
                            {q.number || i+1}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="font-bold text-slate-800 text-sm line-clamp-1">{q.text}</p>
                               {q.correct_answer === "Anulada" && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md uppercase">Anulada</span>
                               )}
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{q.theme}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gabarito: {q.correct_answer}</p>
                         <p className={`text-sm font-black ${answers[i] === q.correct_answer ? "text-emerald-700" : "text-red-700"}`}>
                            Sua: {answers[i] || "-"}
                         </p>
                      </div>
                   </div>
                ))}
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Simulation Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => { if(confirm("Deseja interromper o simulado?")) router.push("/fase1/simulado"); }}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Simulado Ativo</p>
              <h2 className="font-black text-slate-800 leading-none">Questão {currentIndex + 1} de {questions.length}</h2>
            </div>
         </div>

         <div className="flex items-center gap-12">
            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
               <Timer className="w-5 h-5 text-indigo-500" />
               <span className="font-black text-slate-700 tabular-nums">{formatTime(elapsed)}</span>
            </div>
            
            <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
               />
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8 lg:p-16 grid lg:grid-cols-[1fr_350px] gap-12">
          
          {/* Question Body */}
          <div className="space-y-10">
             <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-100">
                      {currentQ.theme}
                   </span>
                   {currentQ.correct_answer === "Anulada" && (
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">
                         Questão Anulada
                      </span>
                   )}
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                   {currentQ.text}
                </p>
             </div>

             {/* Images Area */}
             {currentQ.images && currentQ.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   {currentQ.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video bg-slate-50 rounded-2xl overflow-hidden group border border-slate-100">
                         <img 
                          src={`http://localhost:8000/${img}`} 
                          alt={`Questão ${currentQ.number} - Imagem ${idx + 1}`}
                          className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-500"
                          onClick={() => setZoomImage(`http://localhost:8000/${img}`)}
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                      </div>
                   ))}
                </div>
             )}

             {/* Alternatives */}
             <div className="grid gap-4">
                {Object.entries(currentQ.alternatives).map(([letter, text]) => {
                    const isSelected = selected === letter;
                    const isCorrectChoice = letter === currentQ.correct_answer;
                    const isAnnulled = currentQ.correct_answer === "Anulada";
                    
                    let variantClass = "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50";
                    if (isSelected) {
                       if (isAnnulled) {
                          variantClass = "bg-amber-100 border-amber-300 text-amber-800 shadow-lg shadow-amber-100";
                       } else if (showFeedback) {
                          variantClass = isCorrectChoice ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200";
                       } else {
                          variantClass = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200";
                       }
                    } else if (showFeedback && isCorrectChoice) {
                       variantClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
                    }

                   return (
                      <button 
                        key={letter}
                        onClick={() => handleSelect(letter)}
                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex gap-6 items-start group relative ${variantClass}`}
                      >
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 transition-all ${
                            isSelected ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                         }`}>
                            {letter}
                         </div>
                         <div className="flex-1 pt-1.5 font-bold leading-relaxed">
                            {text}
                         </div>
                         {showFeedback && isCorrectChoice && (
                            <CheckCircle2 className={`w-6 h-6 shrink-0 ${isSelected ? "text-white" : "text-emerald-500"}`} />
                         )}
                         {showFeedback && isSelected && !isCorrectChoice && (
                            <XCircle className="w-6 h-6 shrink-0 text-white" />
                         )}
                      </button>
                   );
                })}
             </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Flag className="w-4 h-4" /> Resumo
                </h3>
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <span className="text-slate-500 font-bold">Respondidas</span>
                      <span className="font-black text-slate-800">{Object.keys(answers).length}/{questions.length}</span>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <span className="text-slate-500 font-bold">Área</span>
                      <span className="font-black text-indigo-600">{currentQ.theme}</span>
                   </div>
                   <div className="flex items-center justify-between py-3">
                      <span className="text-slate-500 font-bold">Origem</span>
                      <span className="font-black text-slate-800">{currentQ.exam_id.replace('_', ' ')}</span>
                   </div>
                </div>

                <div className="pt-4">
                   <button 
                    onClick={handleNext}
                    disabled={!selected}
                    className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all group"
                   >
                     {currentIndex === questions.length - 1 ? "Finalizar" : "Próxima Questão"}
                     <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             {showFeedback && (
                <div className={`p-8 rounded-[2.5rem] border animate-in zoom-in duration-300 ${isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                   <p className={`font-black uppercase tracking-widest text-[10px] mb-2 ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                      {isCorrect ? "Resposta Correta" : "Resposta Incorreta"}
                   </p>
                   <p className={`font-bold leading-relaxed ${isCorrect ? "text-emerald-900" : "text-red-900"}`}>
                      {isCorrect 
                        ? "Muito bem! Você identificou corretamente a conduta clínica recomendada pelo Inep." 
                        : `A alternativa correta é a ${currentQ.correct_answer}. Revise o tema ${currentQ.theme} para consolidar este conhecimento.`}
                   </p>
                </div>
             )}
          </div>

        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setZoomImage(null)}
        >
          <button 
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            onClick={() => setZoomImage(null)}
          >
            <XCircle className="w-12 h-12" />
          </button>
          
          <div 
            className="relative max-w-7xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomImage} 
              alt="Zoom" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function ActiveSimuladoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <ActiveSimuladoContent />
    </Suspense>
  );
}
