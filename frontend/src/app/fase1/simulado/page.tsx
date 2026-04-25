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
  Sparkles,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Componente de Modal de Seleção (Agora com Multi-seleção)
interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { id: string, label: string }[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  icon: React.ReactNode;
}

function SelectionModal({ isOpen, onClose, title, options, selectedValues, onSelect, icon }: SelectionModalProps) {
  const [search, setSearch] = useState("");
  
  if (!isOpen) return null;

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    if (id === "all") {
      onSelect(["all"]);
      return;
    }

    let newValues = [...selectedValues.filter(v => v !== "all")];
    if (newValues.includes(id)) {
      newValues = newValues.filter(v => v !== id);
      if (newValues.length === 0) newValues = ["all"];
    } else {
      newValues.push(id);
    }
    onSelect(newValues);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-sm">
                {icon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{title}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selecione um ou mais filtros</p>
              </div>
            </div>
            <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative group">
            <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-6 rounded-[1.75rem] border border-slate-100 bg-slate-50 text-base font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
              autoFocus
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`w-full text-left p-5 rounded-[1.25rem] border-2 transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-100"
                        : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-white border-white" : "border-slate-200 group-hover:border-indigo-400"}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-sm font-bold tracking-tight">{opt.label}</span>
                    </div>
                    {isSelected && <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Selecionado</span>}
                  </button>
                );
              })
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Search className="w-10 h-10" />
                </div>
                <p className="text-slate-400 font-bold">Nenhum resultado para "{search}"</p>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]"
          >
            Confirmar Seleção ({selectedValues.length === 1 && selectedValues[0] === "all" ? 0 : selectedValues.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function SimuladoConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados dos filtros (Agora como arrays para multi-select)
  const [examId, setExamId] = useState<string>(searchParams.get("exam_id") || "all");
  const [themes, setThemes] = useState<string[]>(["all"]);
  const [specialties, setSpecialties] = useState<string[]>(["all"]);
  const [topics, setTopics] = useState<string[]>(["all"]);
  const [focuses, setFocuses] = useState<string[]>(["all"]);
  
  // Estados dos Modais
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [mode, setMode] = useState("treino");
  const [timeLimit, setTimeLimit] = useState("free");
  const [availableExams, setAvailableExams] = useState<{ id: string, label: string }[]>([]);
  const [availableThemes, setAvailableThemes] = useState<{ id: string, label: string }[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<{ id: string, label: string }[]>([]);
  const [availableTopics, setAvailableTopics] = useState<{ id: string, label: string }[]>([]);
  const [availableFocuses, setAvailableFocuses] = useState<{ id: string, label: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

        const examIds = examsRes.data as string[];
        const formattedExams = examIds.map(id => {
          let label = id;
          if (id.includes("_1")) label = id.replace("_1", " - 1ª Edição");
          if (id.includes("_2")) label = id.replace("_2", " - 2ª Edição");
          return { id, label };
        });
        setAvailableExams([{ id: "all", label: "Todas as Provas" }, ...formattedExams]);

        setAvailableThemes([{ id: "all", label: "Todas as Áreas" }, ...(themesRes.data as string[]).map(n => ({ id: n, label: n }))]);
        setAvailableSpecialties([{ id: "all", label: "Todas as Especialidades" }, ...(specsRes.data as string[]).map(n => ({ id: n, label: n }))]);
        setAvailableTopics([{ id: "all", label: "Todos os Tópicos" }, ...(topicsRes.data as string[]).map(n => ({ id: n, label: n }))]);
        setAvailableFocuses([{ id: "all", label: "Todos os Objetivos" }, ...(focusRes.data as string[]).map(n => ({ id: n, label: n }))]);

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
        theme: !themes.includes("all") ? themes : null,
        specialty: !specialties.includes("all") ? specialties : null,
        topic: !topics.includes("all") ? topics : null,
        focus: !focuses.includes("all") ? focuses : null,
        mode,
        time_limit: timeLimit
      });

      const sessionId = res.data.session_id;
      let url = `/fase1/simulado/questoes?session_id=${sessionId}&mode=${mode}&time_limit=${timeLimit}`;
      // Note: O frontend de questões pode precisar de ajustes para lidar com arrays na URL se o usuário recarregar,
      // mas o session_id já contém os filtros no banco.
      router.push(url);
    } catch (err) {
      console.error("Erro ao iniciar sessão de simulado:", err);
      alert("Erro ao iniciar o simulado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const MultiSelectorButton = ({ values, options, onClick, icon, title }: any) => {
    const count = values.includes("all") ? 0 : values.length;
    let label = "Todas Selecionadas";
    if (count > 0) {
      label = count === 1 
        ? options.find((o: any) => o.id === values[0])?.label 
        : `${count} Selecionados`;
    }
    
    return (
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          {icon} {title}
        </label>
        <button
          onClick={onClick}
          disabled={loading}
          className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
        >
          <div className="flex flex-col items-start overflow-hidden">
            <span className={`text-sm font-bold truncate max-w-full ${count === 0 ? "text-slate-400" : "text-indigo-600"}`}>
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             {count > 0 && <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">{count}</span>}
             <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">

      <SelectionModal
        isOpen={activeModal === "theme"}
        onClose={() => setActiveModal(null)}
        title="Grande Área"
        options={availableThemes}
        selectedValues={themes}
        onSelect={setThemes}
        icon={<Layers className="w-6 h-6" />}
      />

      <SelectionModal
        isOpen={activeModal === "specialty"}
        onClose={() => setActiveModal(null)}
        title="Subtema"
        options={availableSpecialties}
        selectedValues={specialties}
        onSelect={setSpecialties}
        icon={<Filter className="w-6 h-6" />}
      />

      <SelectionModal
        isOpen={activeModal === "topic"}
        onClose={() => setActiveModal(null)}
        title="Tópico Específico"
        options={availableTopics}
        selectedValues={topics}
        onSelect={setTopics}
        icon={<BookOpen className="w-6 h-6" />}
      />

      <SelectionModal
        isOpen={activeModal === "focus"}
        onClose={() => setActiveModal(null)}
        title="Objetivo Clínico"
        options={availableFocuses}
        selectedValues={focuses}
        onSelect={setFocuses}
        icon={<Sparkles className="w-6 h-6" />}
      />

      <div className="max-w-6xl w-full space-y-8 pb-12">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/fase1")}
            className="flex items-center gap-3 text-slate-500 font-bold hover:text-indigo-600 transition-all px-4 py-2 hover:bg-white rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Menu
          </button>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
            <Filter className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden">

          <div className="p-10 md:p-14 space-y-12">

            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200 rotate-3">
                <Target className="w-12 h-12" />
              </div>
              <h1 className="text-4xl font-black text-slate-900">Configurar Simulado</h1>
              <p className="text-slate-500 font-medium">Personalize sua experiência de treino para a Fase 1.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              {/* Seção de Provas (Revertida para Grid Inline) */}
              <div className="lg:col-span-5 space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Selecionar Prova (Ano/Edição)
                </label>
                
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 bg-slate-50 rounded-2xl w-full" />
                    <div className="h-14 bg-slate-50 rounded-2xl w-full" />
                    <div className="h-14 bg-slate-50 rounded-2xl w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[345px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableExams.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setExamId(e.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                          examId === e.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "bg-slate-50 border-transparent text-slate-600 hover:border-indigo-200 hover:bg-white"
                        } ${e.id === "all" ? "sm:col-span-2" : ""}`}
                      >
                        <span className="text-xs font-bold truncate pr-2">{e.label}</span>
                        {examId === e.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna 2: Filtros Multi-select via Modal */}
              <div className="lg:col-span-7 space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <MultiSelectorButton 
                    title="Grande Área"
                    values={themes}
                    options={availableThemes}
                    onClick={() => setActiveModal("theme")}
                    icon={<Layers className="w-4 h-4" />}
                  />
                  <MultiSelectorButton 
                    title="Subtema"
                    values={specialties}
                    options={availableSpecialties}
                    onClick={() => setActiveModal("specialty")}
                    icon={<Filter className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <MultiSelectorButton 
                    title="Objetivo Clínico"
                    values={focuses}
                    options={availableFocuses}
                    onClick={() => setActiveModal("focus")}
                    icon={<Sparkles className="w-4 h-4" />}
                  />
                   <MultiSelectorButton 
                    title="Tópico (Doença)"
                    values={topics}
                    options={availableTopics}
                    onClick={() => setActiveModal("topic")}
                    icon={<BookOpen className="w-4 h-4" />}
                  />
                </div>

                <div className="pt-8 border-t border-slate-50 grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Target className="w-4 h-4" /> Modo de Estudo
                    </label>
                    <div className="flex p-1.5 bg-slate-50 rounded-[1.75rem] gap-2 border border-slate-100 shadow-inner">
                      <button
                        onClick={() => setMode("treino")}
                        className={`flex-1 py-4 rounded-[1.25rem] font-bold text-sm transition-all ${mode === "treino" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/30"}`}
                      >
                        Treino
                      </button>
                      <button
                        onClick={() => setMode("simulado")}
                        className={`flex-1 py-4 rounded-[1.25rem] font-bold text-sm transition-all ${mode === "simulado" ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/30"}`}
                      >
                        Simulado
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Tempo Disponível
                    </label>
                    <div className="flex p-1.5 bg-slate-50 rounded-[1.75rem] gap-2 border border-slate-100 shadow-inner">
                      <button
                        onClick={() => setTimeLimit("free")}
                        disabled={mode === "simulado"}
                        className={`flex-1 py-4 rounded-[1.25rem] font-bold text-sm transition-all ${timeLimit === "free" ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/30"} ${mode === "simulado" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        Livre
                      </button>
                      <button
                        onClick={() => setTimeLimit("4h")}
                        className={`flex-1 py-4 rounded-[1.25rem] font-bold text-sm transition-all ${timeLimit === "4h" ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/30"}`}
                      >
                        4 Horas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-8 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-6 transition-all shadow-2xl hover:shadow-indigo-200 active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/10 to-indigo-600/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Começar Simulado
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform text-indigo-400" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function SimuladoConfigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <SimuladoConfigContent />
    </Suspense>
  );
}
