"use client";

import { useState } from "react";
import { Check, Sparkles, Zap, Shield, ArrowRight, Star, CreditCard, QrCode, X, BrainCircuit, Activity, Stethoscope, Users, CheckCircle2, ChevronRight, Lock, ArrowUpRight, BarChart3, MessageSquare, Trophy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const platformFeatures = [
  "Simulador de Fase 2 Ilimitado",
  "Banco de Questões Fase 1",
  "Preceptor IA com voz em tempo real",
  "Lousa Teórica Dinâmica",
  "Estatísticas avançadas de desempenho",
  "Acesso antecipado a novos casos",
  "Suporte prioritário"
];

const plans = [
  {
    id: "mensal",
    name: "Plano Mensal",
    price: "R$ 97",
    period: "/mês",
    totalPrice: "R$ 97/mês",
    oldPrice: null,
    description: "Ideal para testar a plataforma e alavancar seus estudos na reta final.",
    buttonText: "Assinar Mensal",
    highlight: false
  },
  {
    id: "anual",
    name: "Plano Anual",
    price: "R$ 79",
    period: "/mês",
    totalPrice: "R$ 948 à vista",
    oldPrice: "De R$ 1.164",
    description: "O melhor custo-benefício para garantir sua aprovação. Pague menos por mês.",
    buttonText: "Garantir Aprovação (Anual)",
    highlight: true,
    badge: "MAIS ESCOLHIDO"
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const openPaymentModal = (planId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedPlanId(planId);
    setPaymentModalOpen(true);
  };

  const handleSubscribe = async (billingType: string) => {
    if (!selectedPlanId) return;

    setLoading(billingType);
    try {
      const res = await api.post("/payments/subscribe", {
        plan_type: selectedPlanId,
        billing_type: billingType
      });
      
      // O asaas retorna o invoiceUrl que é o link de pagamento
      const paymentLink = res.data.payment_link;
      if (paymentLink) {
        window.location.href = paymentLink;
      }
    } catch (err) {
      console.error("Erro ao iniciar assinatura:", err);
      toast.error("Ocorreu um erro ao processar sua assinatura. Tente novamente.");
    } finally {
      setLoading(null);
      setPaymentModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Dark Top Section: Navbar + Hero */}
      <div className="bg-gray-900 relative overflow-hidden pb-32 rounded-b-[3rem] shadow-2xl">
         {/* Background Orbs */}
         <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600 rounded-full blur-[120px]" />
         </div>

        {/* Navbar */}
        <nav className="relative z-10 p-8 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 group text-white">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg group-hover:scale-105 transition-transform">
              <span className="font-black text-xl text-white">M</span>
            </div>
            <span className="text-2xl font-black tracking-tight">MedMaster</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-6">
              <span className="text-sm font-bold text-gray-300">Olá, {user.full_name?.split(' ')[0]}</span>
              <button 
                onClick={logout}
                className="text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-bold text-white border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-sm">
              Entrar / Cadastrar
            </Link>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-16 px-8 text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={14} />
            A revolução no estudo
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
            A preparação definitiva para o <span className="text-indigo-400">Revalida</span>.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-3xl mx-auto">
            Utilizamos inteligência artificial para simular cenários reais e garantir que você esteja 100% preparado para a prova teórica e prática.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => {
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/30 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Ver Planos de Acesso <ArrowRight size={20} />
            </button>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 w-full sm:w-auto justify-center">
              <div className="flex -space-x-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-gray-900 flex items-center justify-center"><Users size={14} className="text-white" /></div>
                 <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-gray-900 flex items-center justify-center"><Star size={14} className="text-white" /></div>
                 <div className="w-8 h-8 rounded-full bg-violet-600 border-2 border-gray-900 flex items-center justify-center"><Activity size={14} className="text-white" /></div>
              </div>
              <span className="text-xs font-bold text-gray-300">Junte-se à elite médica</span>
            </div>
          </div>
        </section>
      </div>

      {/* Features Bento Grid - High End Showcase */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-60" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -z-10 opacity-60" />

        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              Tecnologia de Ponta
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Uma experiência de estudo <span className="text-indigo-600">superior</span>.
            </h2>
            <p className="text-lg text-gray-500 font-medium">Combinamos design intuitivo com inteligência artificial para criar o ambiente perfeito para sua aprovação.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[20rem]">
            {/* Casos Práticos - Card Grande e Imersivo */}
            <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gray-900 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl shadow-indigo-200/50 hover:-translate-y-2 transition-all duration-500">
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 group-hover:rotate-6 transition-transform duration-500">
                        <Stethoscope size={32} />
                      </div>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">IA Ativa</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-4xl font-black text-white leading-tight">Simulador de Casos de Voz</h3>
                      <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-sm">
                        Treine para a Fase 2 conversando naturalmente. Nossa tecnologia avalia sua fala e conduta em tempo real com checklists oficiais.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-6 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-end gap-1.5 h-10">
                      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-1.5 bg-indigo-500 rounded-full animate-wave" 
                          style={{ 
                            height: `${h * 100}%`,
                            animationDelay: `${i * 0.15}s`
                          }} 
                        />
                      ))}
                    </div>
                    <div>
                       <p className="text-white font-bold text-sm">Escutando...</p>
                       <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Feedback instantâneo</p>
                    </div>
                  </div>
               </div>
               
               {/* Advanced Decorative Elements */}
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent pointer-events-none" />
               <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] group-hover:bg-indigo-600/30 transition-colors duration-700" />
            </div>

            {/* Banco de Questões - Card Dinâmico */}
            <div className="lg:col-span-2 bg-indigo-50 rounded-[3rem] p-10 relative overflow-hidden group border border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-gray-900 leading-tight">Banco de Questões</h3>
                    <p className="text-gray-600 font-medium text-base">Mais de 1.500 questões do Revalida com resoluções comentadas por IA.</p>
                  </div>
                  
                  <div className="space-y-3 mt-8">
                     <div className="flex gap-3">
                        <div className="flex-1 h-14 bg-white rounded-2xl border border-indigo-100 flex items-center px-5 font-bold text-gray-500 text-sm shadow-sm group-hover:scale-[1.02] transition-transform">
                          Alternativa A
                        </div>
                        <div className="flex-1 h-14 bg-emerald-500 rounded-2xl flex items-center px-5 font-black text-white text-sm shadow-lg shadow-emerald-200 group-hover:scale-[1.05] transition-transform flex justify-between">
                          Alternativa B <Check size={18} />
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <div className="flex-1 h-14 bg-white rounded-2xl border border-indigo-100 flex items-center px-5 font-bold text-gray-500 text-sm shadow-sm group-hover:scale-[0.98] transition-transform">
                          Alternativa C
                        </div>
                        <div className="flex-1 h-14 bg-white rounded-2xl border border-indigo-100 flex items-center px-5 font-bold text-gray-500 text-sm shadow-sm group-hover:scale-[0.98] transition-transform">
                          Alternativa D
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Métricas - Estilo Dashboard */}
            <div className="bg-emerald-50 rounded-[3rem] p-10 relative overflow-hidden border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 group">
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-14 h-14 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-5xl font-black text-emerald-600">92%</p>
                      <ArrowUpRight size={24} className="text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-2">Média de Aprovação</p>
                  </div>
               </div>
               {/* Progress bar simulation */}
               <div className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-200">
                  <div className="h-full bg-emerald-500 w-[92%] transition-all duration-1000 group-hover:w-full" />
               </div>
            </div>

            {/* Suporte - Minimalista e Premium */}
            <div className="bg-white rounded-[3rem] p-10 relative overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all duration-500 group">
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <MessageSquare size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h4 className="font-black text-gray-900 text-xl tracking-tight">Suporte 24/7</h4>
                       <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      Especialistas reais prontos para ajudar você em cada etapa da sua jornada.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why MedMaster Section (Process) */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="md:w-1/2 space-y-8 text-left">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                O único método focado em <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Resultados</span>.
              </h2>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Nós não apenas entregamos conteúdo, nós construímos o caminho para o seu CRM através de tecnologia de ponta e metodologia ativa.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Aprendizado Adaptativo</h4>
                    <p className="text-sm text-gray-500 font-medium">Nossa IA identifica seus pontos fracos e sugere os temas que mais caem.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Simulação de Voz Realista</h4>
                    <p className="text-sm text-gray-500 font-medium">Treine para a prova prática conversando com a IA como se fosse o examinador.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-8">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3">
                  <ShieldCheck className="text-indigo-600 w-8 h-8" />
                  <p className="text-sm font-bold text-gray-900">Checklists Oficiais</p>
                  <p className="text-xs text-gray-500 font-medium">Baseado 100% no padrão do INEP.</p>
                </div>
                <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg text-white space-y-3">
                  <Zap className="w-8 h-8" />
                  <p className="text-sm font-bold">Feedback Imediato</p>
                  <p className="text-xs text-indigo-100 opacity-80">Não espere dias para saber seu erro.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white space-y-3">
                  <BrainCircuit className="w-8 h-8 text-indigo-400" />
                  <p className="text-sm font-bold">Resumos por IA</p>
                  <p className="text-xs text-gray-400">Teoria condensada para facilitar a memorização.</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3">
                  <Users className="text-violet-600 w-8 h-8" />
                  <p className="text-sm font-bold">Comunidade de Elite</p>
                  <p className="text-xs text-gray-500 font-medium">Network com médicos de todo o mundo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech/Science Section - Features Deep Dive */}
      <section className="py-24 bg-gray-50/50 relative overflow-hidden border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">A ciência por trás da sua <span className="text-indigo-600">aprovação</span></h2>
            <p className="text-lg text-gray-500 font-medium">Esqueça os cursinhos tradicionais baseados em decoreba. O MedMaster utiliza algoritmos avançados para otimizar cada minuto do seu estudo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Card 1 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                  <BrainCircuit size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900">Motor de Recomendação IA</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Nosso algoritmo analisa seus erros em tempo real e prioriza os temas com maior probabilidade de cair na sua prova, garantindo um estudo 100% focado.
                  </p>
                </div>
                <ul className="space-y-2 pt-2">
                  {["Análise preditiva", "Foco em Gaps de conhecimento", "Sugestões dinâmicas"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Stethoscope size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900">Processamento de Voz (NLP)</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Tecnologia de ponta que entende termos médicos e condutas clínicas por voz, simulando exatamente o ambiente da prova prática do Revalida.
                  </p>
                </div>
                <ul className="space-y-2 pt-2">
                  {["Reconhecimento de termos médicos", "Avaliação de conduta", "Checklists automáticos"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                  <Activity size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900">Análise de Performance</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Painéis de Business Intelligence aplicados ao seu estudo. Saiba exatamente seu percentil em relação a outros candidatos do Revalida.
                  </p>
                </div>
                <ul className="space-y-2 pt-2">
                  {["Benchmarking de candidatos", "Mapa de calor de temas", "Projeção de nota"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section - High Conversion Investment */}
      <section id="planos" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              Preço Transparente
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Investimento no seu <span className="text-indigo-600">futuro CRM</span>.
            </h2>
            <p className="text-lg text-gray-500 font-medium">Escolha o plano ideal para a sua jornada. Sem taxas escondidas, cancele quando quiser.</p>
          </div>

          {/* Unified Features - Styled Grid */}
          <div className="max-w-5xl mx-auto mb-20 bg-gray-50 rounded-[3rem] p-10 md:p-16 border border-gray-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Trophy size={200} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-10 flex items-center gap-3">
                <Sparkles className="text-indigo-600" />
                Acesso completo em qualquer plano:
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
               {platformFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4 group/item">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover/item:scale-110 transition-transform">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 leading-tight">{feature}</span>
                  </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-10 md:p-14 rounded-[4rem] border transition-all duration-700 hover:-translate-y-2 flex flex-col justify-between group ${
                  plan.highlight 
                  ? "bg-gray-900 border-gray-800 shadow-[0_40px_80px_-15px_rgba(79,70,229,0.3)] text-white" 
                  : "bg-white border-gray-100 shadow-2xl shadow-gray-100 text-gray-900"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/40 z-20">
                    {plan.badge}
                  </div>
                )}

                <div className="text-center">
                  <h3 className={`text-2xl font-black mb-8 uppercase tracking-widest ${plan.highlight ? "text-indigo-400" : "text-gray-400"}`}>
                    {plan.name}
                  </h3>
                  
                  <div className="space-y-1 mb-8">
                    {plan.oldPrice && (
                       <div className="text-lg font-bold text-gray-500 line-through opacity-50">{plan.oldPrice}</div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold opacity-60 self-start mt-4">R$</span>
                      <span className="text-7xl md:text-8xl font-black tracking-tighter">{plan.price.replace("R$", "")}</span>
                      <span className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                        {plan.period}
                      </span>
                    </div>
                    {plan.totalPrice && (
                       <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-4 ${plan.highlight ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                          Economize 20% com o plano anual
                       </div>
                    )}
                  </div>
                  
                  <p className={`text-base font-medium leading-relaxed max-w-xs mx-auto mb-12 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.description}
                  </p>

                  <button 
                    onClick={() => openPaymentModal(plan.id)}
                    className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl group/btn ${
                      plan.highlight 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30" 
                      : "bg-gray-900 text-white hover:bg-black shadow-gray-900/20"
                    }`}
                  >
                    Começar agora <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
                
                <div className="mt-10 flex items-center justify-center gap-6 opacity-40">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <Lock size={12} />
                      Pagamento Seguro
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <CreditCard size={12} />
                      Cartão ou PIX
                   </div>
                </div>
              </div>
            ))}
        </div>

        {/* Info Footer */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-16">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
               <Shield size={24} />
            </div>
            <h4 className="font-black text-gray-900">Segurança Total</h4>
            <p className="text-sm text-gray-500 font-medium">Pagamento processado de forma segura pelo Asaas.</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
               <Star size={24} />
            </div>
            <h4 className="font-black text-gray-900">Garantia de Qualidade</h4>
            <p className="text-sm text-gray-500 font-medium">Material atualizado com as últimas provas do Revalida.</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
               <Check size={24} />
            </div>
            <h4 className="font-black text-gray-900">Cancelamento Fácil</h4>
            <p className="text-sm text-gray-500 font-medium">Cancele sua assinatura a qualquer momento sem burocracia.</p>
          </div>
        </div>
      </div>
    </section>

      {/* Testimonials Section - Wall of Love */}
      <section className="py-32 bg-gray-900 relative overflow-hidden">
        {/* Deep space background effect */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl space-y-4 text-left">
              <div className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Depoimentos Reais
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                O que dizem os <span className="text-indigo-400">aprovados</span>.
              </h2>
              <p className="text-xl text-gray-400 font-medium leading-relaxed">
                Junte-se a milhares de médicos que transformaram sua preparação com o MedMaster.
              </p>
            </div>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {/* Testimonial 1 */}
            <div className="break-inside-avoid bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 text-emerald-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  CRM Verificado
                </div>
              </div>
              <p className="text-indigo-50 text-lg leading-relaxed mb-8 italic font-medium">
                "O simulador com voz me tirou o medo da Fase 2. Cheguei na prova prática com a sensação de que já tinha atendido aqueles pacientes dezenas de vezes. É o divisor de águas!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">LC</div>
                <div>
                  <h4 className="font-bold text-white">Dr. Lucas C.</h4>
                  <p className="text-xs text-indigo-300">Aprovado em 2024.1</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="break-inside-avoid bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 text-emerald-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  CRM Verificado
                </div>
              </div>
              <p className="text-indigo-50 text-lg leading-relaxed mb-8 italic font-medium">
                "As explicações da IA para cada alternativa são fantásticas. Não perco mais tempo procurando em livros por que a letra B estava errada. A agilidade que eu precisava."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">MS</div>
                <div>
                  <h4 className="font-bold text-white">Dra. Mariana S.</h4>
                  <p className="text-xs text-indigo-300">Aprovada em 2024.2</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="break-inside-avoid bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 text-emerald-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  CRM Verificado
                </div>
              </div>
              <p className="text-indigo-50 text-lg leading-relaxed mb-8 italic font-medium">
                "O painel de métricas me mostrou exatamente onde eu estava errando mais (Ginecologia). Foquei nas minhas fraquezas e deu certo! Recomendo para todos."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">RF</div>
                <div>
                  <h4 className="font-bold text-white">Dr. Rafael F.</h4>
                  <p className="text-xs text-indigo-300">Aprovado em 2023.2</p>
                </div>
              </div>
            </div>

            {/* Testimonial 4 - Extra for Masonry Feel */}
            <div className="break-inside-avoid bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 group">
              <Sparkles className="text-white/40 mb-6" size={32} />
              <p className="text-white text-xl font-black leading-tight mb-8">
                "A única que realmente entende a rotina do médico que está revalidando."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white text-sm">AM</div>
                <div>
                  <h4 className="font-bold text-white">Dr. Andre M.</h4>
                  <p className="text-[10px] text-indigo-200 uppercase font-black">Futuro Aprovado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Immersive Finale */}
      <section className="py-32 px-8 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-indigo-200">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600 rounded-full blur-[120px] opacity-20 -ml-48 -mb-48" />
            
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                <Zap size={14} className="animate-pulse" />
                Vagas limitadas para o próximo ciclo
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                Sua jornada para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">CRM</span> começa aqui.
              </h2>
              
              <p className="text-xl text-gray-400 font-medium leading-relaxed">
                Não perca mais tempo com métodos ultrapassados. Junte-se aos médicos que estão revolucionando o estudo para o Revalida com inteligência artificial.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button 
                  onClick={() => {
                    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-600/40 flex items-center gap-3 w-full sm:w-auto justify-center group"
                >
                  Garantir minha vaga <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                </button>
                <Link 
                  href="https://wa.me/5596984176164"
                  target="_blank"
                  className="px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-[2rem] font-bold text-lg hover:bg-white/10 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  Falar com consultor
                </Link>
              </div>

              <div className="flex items-center justify-center gap-8 pt-8 border-t border-white/5 opacity-50">
                 <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    Compra Segura
                 </div>
                 <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
                    <Star size={16} className="text-amber-400" />
                    7 Dias de Garantia
                 </div>
              </div>
            </div>

            {/* Decorative Floating Icons */}
            <div className="absolute top-20 left-20 text-white/5 -rotate-12 hidden lg:block">
              <Stethoscope size={120} />
            </div>
            <div className="absolute bottom-20 right-20 text-white/5 rotate-12 hidden lg:block">
              <BrainCircuit size={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Method Modal */}
      {paymentModalOpen && selectedPlanId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full border border-gray-100 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Como deseja<br/><span className="text-indigo-600">assinar?</span></h2>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all self-start"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSubscribe("CREDIT_CARD")}
                disabled={!!loading}
                className="w-full p-6 flex flex-col items-start gap-2 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all group relative overflow-hidden text-left disabled:opacity-50"
              >
                {loading === "CREDIT_CARD" && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"><Zap className="w-6 h-6 text-indigo-600 animate-spin" /></div>}
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg">Cartão de Crédito</h4>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pagamento automático</p>
                </div>
              </button>

              <button
                onClick={() => handleSubscribe("PIX")}
                disabled={!!loading}
                className="w-full p-6 flex flex-col items-start gap-2 bg-white border-2 border-emerald-100 rounded-3xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all group relative overflow-hidden text-left disabled:opacity-50"
              >
                {loading === "PIX" && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"><Zap className="w-6 h-6 text-emerald-600 animate-spin" /></div>}
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <QrCode size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg">Pix Recorrente</h4>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">QR Code enviado mensal/anual</p>
                </div>
              </button>
            </div>
            
            <p className="text-center text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-widest">
              Pagamento 100% seguro pelo Asaas
            </p>
          </div>
        </div>
      )}

      {/* Auth Modal (Para usuários não logados que tentam comprar) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full border border-gray-100 animate-in zoom-in duration-300 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <button 
                 onClick={() => setAuthModalOpen(false)}
                 className="p-2 hover:bg-gray-100 rounded-xl transition-all"
               >
                 <X className="w-5 h-5 text-gray-400" />
               </button>
            </div>
            
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-3">Crie sua Conta Gratuita</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              Para escolher um plano e iniciar seus estudos na plataforma, você precisa primeiro criar o seu perfil de aluno.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/register"
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Criar Minha Conta <ArrowRight size={18} />
              </Link>
              
              <Link 
                href="/login"
                className="w-full py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center"
              >
                Já tenho uma conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer Minimalista */}
      <footer className="border-t border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="font-black text-sm text-white">M</span>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">MedMaster</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-sm font-bold text-gray-400">© 2026 MedMaster. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4">
                <Link href="/termos" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Termos</Link>
                <Link href="/privacidade" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Privacidade</Link>
              </div>
            </div>
            <Link 
              href="https://cbezerra.com" 
              target="_blank" 
              className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-indigo-500 transition-colors flex items-center gap-2"
            >
              Powered by <span className="text-gray-400 underline decoration-indigo-200">cbezerra.com</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
