"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Stethoscope, Activity, ArrowRight, History, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";

interface CaseModel {
  _id: string;
  title: string;
  category: string;
  description: string;
}

export default function Home() {
  const [cases, setCases] = useState<CaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { logout, user, loading: authLoading } = useAuth();

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

  const handleStartFase1 = async () => {
    try {
      const res = await api.post("/fase1/sessions");
      router.push(`/fase1/${res.data.session_id}`);
    } catch (error) {
      console.error("Failed to start Fase 1 session", error);
      alert("Erro ao iniciar sessão do Tutor.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-slate-500 font-medium italic">
                Olá, <span className="text-slate-800 font-bold not-italic">{user.full_name.split(' ')[0]}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="flex items-center gap-2 bg-white text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-200 hover:shadow-md transition-all group"
            >
              <UserCircle className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              Meu Perfil
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-2 bg-white text-slate-500 font-bold px-4 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
        <header className="mb-12 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Revalida AI Pro</h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Treinamento Interativo de Habilidades Clínicas</p>
          
          <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
            <button 
               onClick={handleStartFase1}
               className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-md hover:shadow-lg"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
               Estudo Teórico (Fase 1)
            </button>
            <button 
               onClick={() => router.push("/historico")}
               className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full transition-colors"
            >
               <History className="w-[18px] h-[18px]" />
               Meu Histórico (Fase 2)
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
            <p>Nenhum caso clínico encontrado no banco de dados.</p>
            <p className="text-sm mt-2">Certifique-se de iniciar o backend e conectar ao MongoDB.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(
              cases.reduce((acc, c) => {
                const cat = c.category || "Geral";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(c);
                return acc;
              }, {} as Record<string, CaseModel[]>)
            ).map(([category, catCases]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">{category}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {catCases.map((c) => (
                    <div key={c._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col justify-between">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">{c.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed mb-6">{c.description}</p>
                      </div>
                      <button 
                        onClick={() => handleStart(c._id)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-semibold py-3 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-colors duration-300"
                      >
                        Iniciar Consulta
                        <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
