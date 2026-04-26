"use client";

import { ChevronLeft, ShieldCheck, ScrollText } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Minimalista */}
      <nav className="p-8 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <span className="font-black">M</span>
          </div>
          <span className="text-xl font-black text-gray-900">MedMaster</span>
        </Link>
        <Link href="/register" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2">
          <ChevronLeft size={16} /> Voltar
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12 md:py-20">
        <div className="space-y-4 mb-16">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <ScrollText size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Termos de Uso</h1>
            <p className="text-gray-500 font-medium">Última atualização: 26 de Abril de 2026</p>
        </div>

        <div className="prose prose-indigo max-w-none space-y-12 text-gray-600 leading-relaxed font-medium">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma MedMaster, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">2. Descrição do Serviço</h2>
            <p>
              O MedMaster é uma ferramenta de auxílio ao estudo para o exame Revalida, fornecendo simulados, banco de questões e interações baseadas em Inteligência Artificial. Nossos serviços são ferramentas de apoio e não garantem aprovação em exames oficiais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">3. Cadastro e Conta</h2>
            <p>
              Para acessar as funcionalidades completas, é necessário criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta. Contas são de uso pessoal e intransferível.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">4. Pagamentos e Assinaturas</h2>
            <p>
              A plataforma utiliza o gateway de pagamento Asaas. As assinaturas (mensais ou anuais) são renovadas automaticamente, a menos que o cancelamento seja solicitado através do perfil do usuário antes da data de renovação.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">5. Uso de Inteligência Artificial</h2>
            <p>
              Nossa tecnologia de IA (Google Gemini) é utilizada para simular cenários clínicos. Embora busquemos a máxima precisão baseada em editais oficiais, as respostas da IA devem ser interpretadas como material de estudo e não como aconselhamento médico real.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">6. Limitação de Responsabilidade</h2>
            <p>
              O MedMaster não se responsabiliza por falhas de conexão, erros técnicos externos ou pelo desempenho individual do aluno em provas oficiais. O conteúdo da plataforma é revisado, mas o usuário deve sempre consultar as fontes oficiais do INEP e editais vigentes.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-gray-50 py-20 mt-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-8 text-center space-y-4">
            <p className="text-gray-400 text-sm font-medium">© 2026 MedMaster. Todos os direitos reservados.</p>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-black">cbezerra.com</p>
        </div>
      </footer>
    </div>
  );
}
