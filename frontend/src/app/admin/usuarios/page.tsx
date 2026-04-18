"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Shield, 
  User as UserIcon, 
  MoreVertical,
  Mail,
  Calendar,
  Filter,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";

interface User {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "student" : "admin";
    if (!confirm(`Tem certeza que deseja mudar a role deste usuário para ${newRole}?`)) return;

    setIsUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (error) {
        alert("Erro ao atualizar role");
    } finally {
        setIsUpdating(null);
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 font-medium">Controle de acessos e permissões da plataforma.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start"
          title="Atualizar lista"
        >
          <RefreshCcw className={`w-5 h-5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Filtros e Busca */}
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold placeholder:text-slate-400"
            />
          </div>
          <button className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center gap-2 border border-slate-200 hover:bg-slate-100 transition-colors">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Permissão</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadastro</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-slate-400 font-bold text-sm">Carregando base de usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-3xl">
                        <UserIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">Nenhum usuário encontrado para sua busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{user.full_name}</p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        user.role === 'admin' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50' 
                          : 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50'
                      }`}>
                        {user.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {user.role === "admin" ? "Administrador" : "Estudante"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => toggleRole(user._id, user.role)}
                        disabled={isUpdating === user._id}
                        className={`text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 ${
                            user.role === "admin"
                            ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                            : "bg-blue-600 text-white hover:bg-blue-500"
                        }`}
                      >
                        {isUpdating === user._id ? (
                            <RefreshCcw className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                            user.role === "admin" ? "Remover Admin" : "Tornar Admin"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            Total de {filteredUsers.length} usuários visualizados
          </p>
          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" />
            Base de dados sincronizada
          </div>
        </div>
      </div>
    </div>
  );
}
