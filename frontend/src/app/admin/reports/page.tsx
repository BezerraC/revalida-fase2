"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Search,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  ChevronRight,
  X
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Report {
  _id: string;
  reason: string;
  description: string;
  question_id: string;
  user_email: string;
  created_at: string;
  status: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Question Preview State
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Erro ao carregar reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status: newStatus });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status do reporte.");
    }
  };

  const handleViewQuestion = async (questionId: string) => {
    setLoadingQuestion(true);
    setIsQuestionModalOpen(true);
    try {
      const res = await api.get(`/questions/${questionId}`);
      setSelectedQuestion(res.data);
    } catch (err) {
      console.error("Erro ao carregar questão:", err);
      toast.error("Erro ao carregar detalhes da questão.");
      setIsQuestionModalOpen(false);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || report.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 flex items-center gap-1.5 w-fit">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case "resolved":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Resolvido
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5 w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reportes de Questões</h1>
          </div>
          <p className="text-slate-500 font-medium">Acompanhe e resolva problemas reportados pelos usuários nas questões do simulado.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[120px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-black text-slate-900">{reports.length}</p>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[120px]">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pendentes</p>
            <p className="text-2xl font-black text-slate-900">{reports.filter(r => r.status === "pending").length}</p>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por motivo, descrição ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl min-w-[180px]">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-bold text-slate-600 outline-none w-full cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="resolved">Resolvidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Carregando Reportes...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo & Data</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 tracking-tight">{report.reason}</p>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[11px] font-bold">{new Date(report.created_at).toLocaleDateString('pt-BR')} às {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-sm">{report.user_email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-medium text-slate-500 max-w-md line-clamp-2 italic">
                        "{report.description || "Sem descrição adicional"}"
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === "pending" ? (
                          <>
                            <button 
                              onClick={() => updateReportStatus(report._id, "resolved")}
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Resolver
                            </button>
                            <button 
                              onClick={() => updateReportStatus(report._id, "dismissed")}
                              className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-200 hover:text-slate-600 transition-all"
                            >
                              Ignorar
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => updateReportStatus(report._id, "pending")}
                            className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-200 hover:text-slate-600 transition-all"
                          >
                            Reabrir
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewQuestion(report.question_id)}
                          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600" 
                          title="Ver Questão"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-slate-800">Nenhum reporte encontrado</p>
              <p className="text-slate-500 text-sm">Tente ajustar seus filtros ou busca.</p>
            </div>
          </div>
        )}
        </div>

      {/* Question Preview Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visualizar Questão</h2>
                  <p className="text-sm text-slate-500 font-medium">Confira os detalhes da questão reportada.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsQuestionModalOpen(false);
                  setSelectedQuestion(null);
                }}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
              {loadingQuestion ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Buscando dados da questão...</p>
                </div>
              ) : selectedQuestion ? (
                <div className="space-y-8">
                  {/* Question Header */}
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
                      {selectedQuestion.theme}
                    </span>
                    <span className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-[0.15em]">
                      {selectedQuestion.exam_id?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {selectedQuestion.text}
                    </p>
                  </div>

                  {/* Images if any */}
                  {selectedQuestion.images && selectedQuestion.images.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedQuestion.images.map((img: string, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                          <img 
                            src={img.startsWith('http') ? img : `http://localhost:8000/exams/images/${img}`} 
                            alt={`Imagem ${idx + 1}`} 
                            className="w-full h-auto object-contain rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alternatives */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternativas</h3>
                    <div className="grid gap-4">
                      {Object.entries(selectedQuestion.alternatives).map(([letter, text]: [string, any]) => (
                        <div 
                          key={letter}
                          className={`p-6 rounded-2xl border-2 flex gap-6 items-start transition-all ${
                            letter === selectedQuestion.correct_answer 
                              ? "bg-emerald-50 border-emerald-500 shadow-sm" 
                              : "bg-white border-slate-100"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                            letter === selectedQuestion.correct_answer 
                              ? "bg-emerald-600 text-white" 
                              : "bg-slate-100 text-slate-400"
                          }`}>
                            {letter}
                          </div>
                          <p className={`pt-2 font-bold text-lg ${
                            letter === selectedQuestion.correct_answer ? "text-emerald-900" : "text-slate-700"
                          }`}>
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setIsQuestionModalOpen(false)}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
