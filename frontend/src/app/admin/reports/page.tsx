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
  ChevronRight
} from "lucide-react";
import Link from "next/link";

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
      alert("Erro ao atualizar status do reporte.");
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
                        <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600" title="Ver Questão">
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
    </div>
  );
}
