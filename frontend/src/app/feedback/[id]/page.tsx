"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Activity, ClipboardCheck, ArrowLeft, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Feedback() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchFeedback = async () => {
        if (!id) return;
        
        try {
            const res = await api.post(`/feedback/${id}`);
            setFeedback(res.data.feedback);
        } catch (err: any) {
            console.error("Error generating feedback:", err);
            setError(err.response?.data?.detail || "Erro ao gerar feedback.");
        } finally {
            setLoading(false);
        }
    };
    fetchFeedback();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Casos
          </button>
        </header>

        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-100">
            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 shadow-sm">
              <ClipboardCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Resultado da Avaliação</h1>
              <p className="text-slate-500 mt-1 font-medium">Feedback detalhado baseado na Consulta e Checklist.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Activity className="w-12 h-12 text-blue-600 animate-spin mb-6" />
              <p className="text-xl font-medium text-slate-700">A IA está analisando a transcrição da sua consulta...</p>
              <p className="text-base opacity-70 mt-2">Isso pode levar alguns segundos. Avaliando de acordo com os critérios do Revalida INEP.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col gap-4 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="font-semibold text-lg">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="self-start text-sm font-bold bg-white text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors shadow-sm"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="text-slate-700 leading-relaxed space-y-6">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-slate-600 pl-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                }}
              >
                {feedback}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
