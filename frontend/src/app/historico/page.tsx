"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FileText, ArrowRight, Activity, ArrowLeft } from "lucide-react";

interface HistoryItem {
  session_id: string;
  case_id: string;
  case_title: string;
  case_category: string;
  turns_count: number;
  has_feedback: boolean;
}

export default function Historico() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios.get("http://localhost:8000/history")
      .then(res => {
          setHistory(res.data.history);
          setLoading(false);
      })
      .catch(err => {
          console.error("Error loading history", err);
          setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
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
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Histórico de Consultas</h1>
                <p className="text-slate-500 mt-1 font-medium">Reveja suas simulações e os feedbacks recebidos.</p>
             </div>
          </div>
        </header>

        {loading ? (
           <div className="flex justify-center py-20">
             <Activity className="w-10 h-10 text-emerald-500 animate-pulse" />
           </div>
        ) : history.length === 0 ? (
           <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Nenhum histórico encontrado</h3>
              <p className="text-slate-500 mt-2">Você ainda não concluiu nenhuma consulta ou não enviou mensagens ao paciente.</p>
           </div>
        ) : (
           <div className="flex flex-col gap-4">
              {history.map(item => (
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
                       <p className="text-slate-500 text-sm mt-1">Trocas de mensagens realizadas: {Math.floor(item.turns_count / 2)}</p>
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
        )}
      </div>
    </div>
  );
}
