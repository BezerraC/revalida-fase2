"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Stethoscope, Activity, ArrowRight, History } from "lucide-react";
import Link from "next/link";

interface CaseModel {
  _id: string;
  title: string;
  category: string;
  description: string;
}

export default function Fase2() {
  const [cases, setCases] = useState<CaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get("/cases");
        setCases(res.data);
      } catch (err) {
        console.error("Error fetching cases", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStart = async (caseId: string) => {
    try {
      const res = await api.post("/sessions", { case_id: caseId });
      router.push(`/simulacao/${res.data.session_id}`);
    } catch (error) {
      console.error("Failed to start session", error);
      alert("Erro ao iniciar sessão do caso.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <div className="flex justify-center items-center mb-4">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-200">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Fase 2: Prova Prática</h1>
        <p className="text-gray-500 mt-3 text-lg font-medium max-w-2xl mx-auto">
          Treinamento Interativo de Habilidades Clínicas com IA. Escolha um caso abaixo para iniciar sua simulação.
        </p>
        
        <div className="flex justify-center mt-8">
          <Link 
             href="/historico"
             className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-8 py-3 rounded-xl transition-all shadow-sm border border-gray-200"
          >
             <History size={20} />
             Ver Meu Histórico de Casos
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium">Carregando casos clínicos...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200">
          <Stethoscope className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-400">Nenhum caso disponível no momento.</p>
          <p className="text-sm mt-2">Nossa equipe está preparando novos cenários para você.</p>
        </div>
      ) : (
        <div className="space-y-16 pb-12">
          {Object.entries(
            cases.reduce((acc, c) => {
              const cat = c.category || "Geral";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(c);
              return acc;
            }, {} as Record<string, CaseModel[]>)
          ).map(([category, catCases]) => (
            <div key={category}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <div className="flex-grow h-px bg-gray-100"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{catCases.length} Casos</span>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {catCases.map((c) => (
                  <div key={c._id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg mb-4">
                        <Activity size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{c.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{c.description}</p>
                    </div>
                    <div className="mt-auto pt-6 border-t border-gray-50">
                      <button 
                        onClick={() => handleStart(c._id)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all duration-300"
                      >
                        Iniciar Simulação
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
