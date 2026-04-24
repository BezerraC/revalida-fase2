"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
  Target,
  ChevronLeft,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  BookOpen,
  Sparkles
} from "lucide-react";

function SimuladoConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Opções de configuração
  const [examId, setExamId] = useState(searchParams.get("exam_id") || "all");
  const [theme, setTheme] = useState(searchParams.get("theme") || "all");
  const [specialty, setSpecialty] = useState("all");
  const [topic, setTopic] = useState("all");
  const [focus, setFocus] = useState("all");
  const [searchExam, setSearchExam] = useState("");
  const [searchTheme, setSearchTheme] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [searchTopic, setSearchTopic] = useState("");
  const [searchFocus, setSearchFocus] = useState("");
  const [mode, setMode] = useState("treino");
  const [timeLimit, setTimeLimit] = useState("free"); // "free" ou "4h"
  const [availableExams, setAvailableExams] = useState<{ id: string, label: string }[]>([]);
  const [availableThemes, setAvailableThemes] = useState<{ id: string, label: string }[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<{ id: string, label: string }[]>([]);
  const [availableTopics, setAvailableTopics] = useState<{ id: string, label: string }[]>([]);
  const [availableFocuses, setAvailableFocuses] = useState<{ id: string, label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Forçar 4h se o modo for simulado
  useEffect(() => {
    if (mode === "simulado") {
      setTimeLimit("4h");
    }
  }, [mode]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [examsRes, themesRes, specsRes, topicsRes, focusRes] = await Promise.all([
          api.get("/exams"),
          api.get("/themes"),
          api.get("/specialties"),
          api.get("/topics"),
          api.get("/focus")
        ]);

        // Formatar Provas
        const examIds = examsRes.data as string[];
        const formattedExams = examIds.map(id => {
          let label = id;
          if (id.includes("_1")) label = id.replace("_1", " - 1ª Edição");
          if (id.includes("_2")) label = id.replace("_2", " - 2ª Edição");
          return { id, label };
        });
        setAvailableExams([{ id: "all", label: "Todas as Provas" }, ...formattedExams]);

        // Formatar Temas
        const themeNames = themesRes.data as string[];
        const formattedThemes = themeNames.map(name => ({ id: name, label: name }));
        setAvailableThemes([{ id: "all", label: "Todos os Temas" }, ...formattedThemes]);

        // Formatar Especialidades
        const specNames = specsRes.data as string[];
        const formattedSpecs = specNames.map(name => ({ id: name, label: name }));
        setAvailableSpecialties([{ id: "all", label: "Todas as Especialidades" }, ...formattedSpecs]);

        // Formatar Tópicos
        const topicNames = topicsRes.data as string[];
        const formattedTopics = topicNames.map(name => ({ id: name, label: name }));
        setAvailableTopics([{ id: "all", label: "Todos os Tópicos" }, ...formattedTopics]);

        // Formatar Focus
        const focusNames = focusRes.data as string[];
        const formattedFocus = focusNames.map(name => ({ id: name, label: name }));
        setAvailableFocuses([{ id: "all", label: "Todos os Objetivos" }, ...formattedFocus]);

      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await api.post("/simulado/sessions", {
        exam_id: examId !== "all" ? examId : null,
        theme: theme !== "all" ? theme : null,
        specialty: specialty !== "all" ? specialty : null,
        topic: topic !== "all" ? topic : null,
        focus: focus !== "all" ? focus : null,
        mode,
        time_limit: timeLimit
      });

      const sessionId = res.data.session_id;
      let url = `/fase1/simulado/questoes?session_id=${sessionId}&mode=${mode}&time_limit=${timeLimit}`;
      if (examId !== "all") url += `&exam_id=${examId}`;
      if (theme !== "all") url += `&theme=${theme}`;
      if (specialty !== "all") url += `&specialty=${specialty}`;
      if (topic !== "all") url += `&topic=${topic}`;
      if (focus !== "all") url += `&focus=${focus}`;
      router.push(url);
    } catch (err) {
      console.error("Erro ao iniciar sessão de simulado:", err);
      alert("Erro ao iniciar o simulado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">

      <div className="max-w-4xl w-full space-y-8">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/fase1")}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Menu
          </button>
          <div className="p-2 bg-slate-200 rounded-lg">
            <Filter className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">

          <div className="p-10 md:p-14 space-y-12">

            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-slate-900">Configurar Simulado</h1>
              <p className="text-slate-500 font-medium">Personalize sua experiência de treino para a Fase 1.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start">

              {/* Seleção de Prova */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Selecionar Prova
                </label>

                {loading ? (
                  <div className="flex items-center gap-3 p-8 text-slate-400 font-bold">
                    <div className="w-4 h-4 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    Carregando provas...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* <div className="relative group">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Buscar prova por ano..."
                        value={searchExam}
                        onChange={(e) => setSearchExam(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                      />
                    </div> */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[285px] sm:max-h-fit overflow-y-auto pr-2 custom-scrollbar">
                      {availableExams.filter(e => e.label.toLowerCase().includes(searchExam.toLowerCase())).map(e => (
                        <button
                          key={e.id}
                          onClick={() => setExamId(e.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${examId === e.id
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100"
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                            } ${e.id === "all" ? "sm:col-span-2" : ""}`}
                        >
                          <span className="text-xs font-bold">{e.label}</span>
                          {examId === e.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seleção de Tema */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Grande Área
                </label>
                <div className="relative group">
                  <Search className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Filtrar áreas..."
                    value={searchTheme}
                    onChange={(e) => setSearchTheme(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                  />
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  disabled={loading}
                >
                  {availableThemes.filter(t => t.id === "all" || t.label.toLowerCase().includes(searchTheme.toLowerCase())).map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                <div className="pt-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Subtema (Especialidade)
                  </label>
                  <div className="relative group">
                    <Search className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Filtrar especialidades..."
                      value={searchSpecialty}
                      onChange={(e) => setSearchSpecialty(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                    />
                  </div>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    disabled={loading}
                  >
                    {availableSpecialties.filter(s => s.id === "all" || s.label.toLowerCase().includes(searchSpecialty.toLowerCase())).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Tópico Específico (Doença)
                  </label>
                  <div className="relative group">
                    <Search className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Filtrar doenças..."
                      value={searchTopic}
                      onChange={(e) => setSearchTopic(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                    />
                  </div>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    disabled={loading}
                  >
                    {availableTopics.filter(t => t.id === "all" || t.label.toLowerCase().includes(searchTopic.toLowerCase())).map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Objetivo Clínico (Focus)
                  </label>
                  <div className="relative group">
                    <Search className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Filtrar objetivos..."
                      value={searchFocus}
                      onChange={(e) => setSearchFocus(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                    />
                  </div>
                  <select
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    disabled={loading}
                  >
                    {availableFocuses.filter(f => f.id === "all" || f.label.toLowerCase().includes(searchFocus.toLowerCase())).map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Modo e Tempo em linha única */}
            <div className="grid md:grid-cols-2 gap-10 border-t border-slate-50">

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4" /> Modo de Estudo
                </label>
                <div className="flex p-2 bg-slate-100 rounded-2xl gap-2">
                  <button
                    onClick={() => setMode("treino")}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all ${mode === "treino" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-200/50"}`}
                  >
                    Treino
                  </button>
                  <button
                    onClick={() => setMode("simulado")}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all ${mode === "simulado" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-200/50"}`}
                  >
                    Simulado
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center italic">
                  {mode === "treino" ? "Feedback imediato após cada resposta." : "Resultados exibidos apenas no final."}
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Tempo da Prova
                </label>
                <div className="flex p-2 bg-slate-100 rounded-2xl gap-2">
                  <button
                    onClick={() => setTimeLimit("free")}
                    disabled={mode === "simulado"}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all ${timeLimit === "free" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-200/50"} ${mode === "simulado" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Tempo Livre
                  </button>
                  <button
                    onClick={() => setTimeLimit("4h")}
                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all ${timeLimit === "4h" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-200/50"}`}
                  >
                    Até 4 Horas
                  </button>
                </div>
                {mode === "simulado" && (
                  <p className="text-[9px] text-indigo-500 font-black text-center uppercase tracking-tighter">
                    Obrigatório 4h no modo Simulado
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 group"
            >
              Começar Simulado
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform text-indigo-400" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function SimuladoConfigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <SimuladoConfigContent />
    </Suspense>
  );
}
