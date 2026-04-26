"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Stethoscope, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Target,
  Activity,
  Award
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [areaMastery, setAreaMastery] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data.stats);
        setRecentActivity(res.data.recent_activity);
        setAreaMastery(res.data.area_mastery);
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const getIcon = (name: string, colorClass: string) => {
    switch (name) {
      case "BookOpen": return <BookOpen className={colorClass} />;
      case "Target": return <Target className={colorClass} />;
      case "Clock": return <Clock className={colorClass} />;
      case "CheckCircle": return <CheckCircle className={colorClass} />;
      default: return <Activity className={colorClass} />;
    }
  };

  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      "Clínica Médica": "bg-blue-500",
      "Cirurgia Geral": "bg-red-500",
      "Ginecologia e Obstetrícia": "bg-pink-500",
      "Pediatria": "bg-amber-500",
      "Saúde Coletiva": "bg-emerald-500",
    };
    return colors[area] || "bg-indigo-500";
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh]">
              <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
      );
  }

  const isSubscribed = user?.subscription_status === "active" || user?.role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 p-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl text-white font-black mb-4 leading-tight tracking-tighter">
              Olá, Dr. {user?.full_name?.split(' ')[0] || "Médico"}!
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl mb-8 leading-relaxed opacity-90 font-medium">
              Sua jornada para a revalidação continua aqui. Qual fase vamos conquistar hoje?
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href={isSubscribed ? "/fase1" : "/planos"}
                className="px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-lg hover:shadow-white/20 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                {isSubscribed ? "Começar Estudos" : "Ver Planos de Acesso"}
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
      </section>

      {/* Main Choice Cards */}
      <section className="relative">
        {!isSubscribed && (
          <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] rounded-[3rem] flex items-center justify-center p-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-indigo-50 text-center max-w-md animate-in zoom-in duration-500">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award size={32} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h3>
               <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                 Sua conta gratuita permite visualizar o progresso, mas para acessar os simuladores e o Preceptor IA, você precisa de uma assinatura ativa.
               </p>
               <Link 
                 href="/planos"
                 className="block w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
               >
                 Escolher Plano
               </Link>
               
               {/* BOTÃO PARA FACILITAR TESTES NO COMPUTADOR LOCAL */}
               <button 
                 onClick={async () => {
                    try {
                       await api.get("/payments/dev-activate");
                       window.location.reload();
                    } catch(e) {
                       toast.error("Erro ao ativar. Verifique se o backend está rodando.");
                    }
                 }}
                 className="block w-full mt-4 py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm border border-gray-200"
               >
                 🪄 Forçar Ativação (Apenas DEV)
               </button>
            </div>
          </div>
        )}
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!isSubscribed ? "opacity-50 pointer-events-none grayscale" : ""}`}>
          {/* Fase 1 Card */}
          <Link href="/fase1" className="group">
            <div className="h-full bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-blue-100">
                <BookOpen size={32} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Fase 1: Objetiva</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Acesse milhares de questões classificadas, simulados oficiais e acompanhamento por tema médico.
              </p>
              <div className="flex items-center text-indigo-600 font-black uppercase tracking-widest text-xs">
                Explorar Fase 1
                <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Fase 2 Card */}
          <Link href="/fase2" className="group">
            <div className="h-full bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-violet-100 transition-all duration-500 relative overflow-hidden">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-lg shadow-indigo-100">
                <Stethoscope size={32} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Fase 2: Prática</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Treine com casos clínicos interativos, checklists oficiais e simulações realistas de atendimento.
              </p>
              <div className="flex items-center text-indigo-600 font-black uppercase tracking-widest text-xs">
                Explorar Fase 2
                <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Statistics Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Seu Desempenho</h2>
          <Link href="/perfil" className="text-indigo-600 text-sm font-bold hover:underline">Ver relatório completo</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 rounded-xl">{getIcon(stat.icon, stat.color)}</div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Grid: Recent Activity & Area Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Recent Activity */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              Atividades Recentes
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.type === "Fase 1" ? "bg-blue-500" : "bg-violet-500"}`} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                    <p className="text-xs text-gray-500">
                      {activity.type} • {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('pt-BR') : 'Concluído'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600">{activity.score}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            )) : (
                <div className="p-12 text-center text-slate-400">
                    <p className="text-sm">Nenhuma atividade recente registrada.</p>
                </div>
            )}
          </div>
        </section>

        {/* Areas Mastery */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6">Domínio por Área</h2>
          <div className="space-y-6">
            {areaMastery.map((area) => (
              <div key={area.area}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-700">{area.area}</span>
                  <span className="text-gray-500">{area.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getAreaColor(area.area)} rounded-full transition-all duration-1000`} 
                    style={{ width: `${area.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
