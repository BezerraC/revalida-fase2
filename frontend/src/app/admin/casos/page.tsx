"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronRight,
  Stethoscope,
  Tags,
  FileText,
  ListChecks,
  X,
  PlusCircle,
  Save,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";

interface Case {
  _id: string;
  title: string;
  category: string;
  description: string;
  patient_system_prompt: string;
  checklist: string[];
}

function CasesContent() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState<Partial<Case> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      handleOpenCreate();
    }
  }, [searchParams]);

  async function fetchCases() {
    setLoading(true);
    try {
      const response = await api.get("/cases");
      setCases(response.data);
    } catch (error) {
      console.error("Erro ao carregar casos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setCurrentCase({
      title: "",
      category: "Clínica Médica",
      description: "",
      patient_system_prompt: "",
      checklist: [""]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Case) => {
    setCurrentCase(c);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este cenário? Esta ação é irreversível.")) return;
    try {
      await api.delete(`/admin/cases/${id}`);
      await fetchCases();
    } catch (error) {
      alert("Erro ao excluir caso");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase) return;
    
    setIsSaving(true);
    try {
      if (currentCase._id) {
        // Update
        await api.patch(`/admin/cases/${currentCase._id}`, currentCase);
      } else {
        // Create
        await api.post("/admin/cases", currentCase);
      }
      await fetchCases();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar cenário. Verifique os campos.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateChecklistItem = (index: number, value: string) => {
    if (!currentCase || !currentCase.checklist) return;
    const newList = [...currentCase.checklist];
    newList[index] = value;
    setCurrentCase({ ...currentCase, checklist: newList });
  };

  const addChecklistItem = () => {
    if (!currentCase) return;
    setCurrentCase({
      ...currentCase,
      checklist: [...(currentCase.checklist || []), ""]
    });
  };

  const removeChecklistItem = (index: number) => {
    if (!currentCase || !currentCase.checklist) return;
    const newList = currentCase.checklist.filter((_, i) => i !== index);
    setCurrentCase({ ...currentCase, checklist: newList });
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Cenários</h1>
          <p className="text-slate-500 font-medium">Crie e edite as simulações práticas da plataforma.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg shadow-blue-900/10 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Novo Cenário
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text"
              placeholder="Pesquisar por título ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Cenário</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr>
                    <td colSpan={3} className="px-8 py-10 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    </td>
                 </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhum cenário cadastrado.</td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <p className="font-black text-slate-800">{c.title}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(c)}
                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(c._id)}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && currentCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{currentCase._id ? "Editar Cenário" : "Novo Cenário Clínico"}</h2>
                <p className="text-sm text-slate-500 font-medium">Preencha os dados do paciente e o guia da IA.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Info Básica */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título do Cenário</label>
                    <input 
                      type="text"
                      required
                      value={currentCase.title}
                      onChange={(e) => setCurrentCase({...currentCase, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold"
                      placeholder="Ex: Suspeita de Infarto"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoria (Área)</label>
                    <select 
                      value={currentCase.category}
                      onChange={(e) => setCurrentCase({...currentCase, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold appearance-none"
                    >
                      <option>Infectologia</option>
                      <option>Pediatria</option>
                      <option>Cirurgia Geral</option>
                      <option>Clínica Médica</option>
                      <option>Ginecologia e Obstetrícia</option>
                      <option>Saúde da Família</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descrição Curta (Instrução para o Aluno)</label>
                    <textarea 
                      required
                      rows={3}
                      value={currentCase.description}
                      onChange={(e) => setCurrentCase({...currentCase, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold resize-none"
                      placeholder="O que o aluno verá antes de começar..."
                    />
                  </div>
                </div>

                {/* Lado Direito: IA */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Prompt de Sistema do Paciente (Personalidade)</label>
                    <textarea 
                      required
                      rows={8}
                      value={currentCase.patient_system_prompt}
                      onChange={(e) => setCurrentCase({...currentCase, patient_system_prompt: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-xs leading-relaxed"
                      placeholder="Instruções de como a IA deve agir..."
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Checklist */}
              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Checklist de Avaliação</h3>
                    <p className="text-sm text-slate-500 font-medium">Itens que a IA buscará na conduta do aluno.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={addChecklistItem}
                    className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-500 p-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Adicionar Item
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {currentCase.checklist?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 group">
                      <div className="w-10 h-10 flex items-center justify-center font-black text-xs text-slate-400 bg-slate-50 rounded-xl">
                        {idx + 1}
                      </div>
                      <input 
                        type="text"
                        value={item}
                        onChange={(e) => updateChecklistItem(idx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 px-6 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                        placeholder="Ex: Solicitou exame de sangue"
                      />
                      <button 
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
               <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
               >
                 Descartar
               </button>
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg shadow-blue-900/10"
               >
                 {isSaving ? "Salvando..." : (
                   <>
                    <Save className="w-5 h-5" />
                    Salvar Cenário
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CasesAdminPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CasesContent />
    </Suspense>
  );
}
