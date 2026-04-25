"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

  // Mock statistics data
  const stats = [
    { label: "Questões Respondidas", value: "1,240", icon: <BookOpen className="text-blue-500" />, trend: "+12% esta semana" },
    { label: "Desempenho Geral", value: "78%", icon: <Target className="text-emerald-500" />, trend: "Top 5% dos alunos" },
    { label: "Horas de Estudo", value: "45h", icon: <Clock className="text-amber-500" />, trend: "Meta: 50h/mês" },
    { label: "Casos Concluídos", value: "24", icon: <CheckCircle className="text-indigo-500" />, trend: "Fase 2 Prática" },
  ];

  const recentActivity = [
    { id: 1, title: "Simulado Revalida 2024.2", type: "Fase 1", date: "Há 2 horas", score: "82/100" },
    { id: 2, title: "Caso Clínico: Pré-eclâmpsia", type: "Fase 2", date: "Ontem", score: "9.5/10" },
    { id: 3, title: "Pediatria: Crescimento e Desenv.", type: "Fase 1", date: "2 dias atrás", score: "18/20" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 p-8">
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
                href="/fase1"
                className="px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-lg hover:shadow-white/20 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Começar Estudos
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
      </section>

      {/* Main Choice Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="p-2 bg-gray-50 rounded-xl">{stat.icon}</div>
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.type === "Fase 1" ? "bg-blue-500" : "bg-violet-500"}`} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                    <p className="text-xs text-gray-500">{activity.type} • {activity.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600">{activity.score}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Areas Mastery */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6">Domínio por Área</h2>
          <div className="space-y-6">
            {[
              { area: "Clínica Médica", color: "bg-blue-500", progress: 85 },
              { area: "Cirurgia Geral", color: "bg-red-500", progress: 62 },
              { area: "Ginecologia e Obstetrícia", color: "bg-pink-500", progress: 78 },
              { area: "Pediatria", color: "bg-amber-500", progress: 92 },
              { area: "Saúde Coletiva", color: "bg-emerald-500", progress: 70 },
            ].map((area) => (
              <div key={area.area}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-700">{area.area}</span>
                  <span className="text-gray-500">{area.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${area.color} rounded-full transition-all duration-1000`} 
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
