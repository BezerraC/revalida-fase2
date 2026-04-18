"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  BrainCircuit
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface Stats {
  total_users: number;
  total_cases: number;
  total_sessions: number;
  fase2_sessions: number;
  fase1_sessions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { 
      label: "Total de Alunos", 
      value: stats?.total_users || 0, 
      icon: Users, 
      color: "blue",
      description: "Usuários cadastrados no sistema"
    },
    { 
      label: "Cenários Clínicos", 
      value: stats?.total_cases || 0, 
      icon: Stethoscope, 
      color: "emerald",
      description: "Casos ativos para simulação"
    },
    { 
      label: "Interações de IA", 
      value: stats?.total_sessions || 0, 
      icon: BrainCircuit, 
      color: "purple",
      description: "Sessões totais (Fase 1 e 2)"
    },
    { 
      label: "Simulações Reais", 
      value: stats?.fase2_sessions || 0, 
      icon: MessageSquare, 
      color: "amber",
      description: "Treinamentos práticos realizados"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Administrativo</h1>
        <p className="text-slate-500 font-medium">Bem-vindo de volta! Aqui está uma visão geral do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div 
            key={card.label} 
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-black uppercase">
                <TrendingUp className="w-3 h-3" />
                Live
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 mb-1">{card.value}</h3>
            <p className="text-sm font-black text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-xs text-slate-400 mt-3 font-medium">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Seção Inferior: Atalhos e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] group-hover:bg-blue-600/20 transition-all" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-4">Gerenciamento de Inteligência</h2>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed max-w-xl">
              Como administrador, você pode criar novos cenários clínicos personalizados, calibrar os prompts de sistema dos pacientes e ajustar os checklists de avaliação.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/admin/casos?new=true"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 group/btn shadow-lg shadow-blue-900/40"
              >
                Novo Cenário Clínico
                <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </Link>
              <Link 
                href="/admin/auditoria"
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black transition-all border border-slate-700"
              >
                Auditar Sessões
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Status do Sistema
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Servidor API</span>
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Banco de Dados</span>
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Gemini AI</span>
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Pronto
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
