"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Search, 
  Eye, 
  Clock, 
  User as UserIcon, 
  MessageSquare,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import api from "@/lib/api";

interface Session {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  case_id: string;
  case_title: string;
  turns_count: number;
  feedback: string | null;
  history: { role: string; text: string }[];
}

export default function AuditPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal de visualização
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const response = await api.get("/admin/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetail = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const filteredSessions = sessions.filter(s => 
    s.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Auditoria de Sessões</h1>
          <p className="text-slate-500 font-medium">Monitore o desempenho dos alunos e as interações da IA.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text"
              placeholder="Buscar por aluno ou cenário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cenário Clínico</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Turnos</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold">
                     <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                     Sincronizando sessões...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhuma sessão encontrada.</td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{s.user_name}</p>
                          <p className="text-xs font-bold text-slate-400">{s.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500" />
                         <span className="font-bold text-slate-700">{s.case_title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${s.feedback ? "text-emerald-500" : "text-amber-500"}`}>
                             {s.feedback ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                             {s.feedback ? "Finalizada com Feedback" : "Em Aberto / Sem Feedback"}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{s.turns_count} interações realizadas</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={() => handleOpenDetail(s)}
                        className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm"
                        title="Ver Atendimento"
                       >
                         <Eye className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Sessão */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-0 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            {/* Header do Modal */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <MessageSquare className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">Detalhes do Atendimento</h2>
                    <div className="flex items-center gap-4 mt-1">
                       <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 text-blue-600">
                          <UserIcon className="w-4 h-4" />
                          {selectedSession.user_name}
                       </p>
                       <div className="w-1 h-1 bg-slate-300 rounded-full" />
                       <p className="text-sm font-bold text-slate-500">
                          Cenário: {selectedSession.case_title}
                       </p>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal (Histórico) */}
            <div className="flex-1 overflow-y-auto p-10 bg-[grid-slate-100_1px_1px] bg-[size:20px_20px]">
               <div className="max-w-3xl mx-auto space-y-6">
                 {selectedSession.history.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                       <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold">Nenhuma mensagem registrada nesta sessão.</p>
                    </div>
                 ) : (
                    selectedSession.history.map((msg, idx) => (
                       <div 
                        key={idx}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                       >
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4 mr-4">
                            {msg.role === 'user' ? 'Aluno (Médico)' : 'IA (Paciente)'}
                         </span>
                         <div className={`p-5 rounded-3xl max-w-[85%] font-medium text-sm leading-relaxed shadow-sm border ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                            : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                         }`}>
                           {msg.text}
                         </div>
                       </div>
                    ))
                 )}

                 {/* Seção de Feedback do Admin */}
                 {selectedSession.feedback && (
                    <div className="mt-12 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-8 relative overflow-hidden group">
                       <FileText className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-100 group-hover:scale-110 transition-transform" />
                       <h3 className="text-lg font-black text-emerald-800 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6" />
                          Avaliação Final da IA
                       </h3>
                       <div className="prose prose-slate prose-sm max-w-none text-emerald-900 font-medium leading-relaxed whitespace-pre-wrap">
                          {selectedSession.feedback}
                       </div>
                    </div>
                 )}
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-center">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-4 h-4" />
                   Fim da Auditoria de Atendimento
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
