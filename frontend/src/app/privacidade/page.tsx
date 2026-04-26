"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Política de Privacidade</h1>
            <p className="text-gray-500 font-medium">Última atualização: 26 de Abril de 2026</p>
        </div>

        <div className="prose prose-emerald max-w-none space-y-12 text-gray-600 leading-relaxed font-medium">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">1. Coleta de Informações</h2>
            <p>
              Coletamos informações básicas como nome completo, e-mail, CPF e telefone para fins de identificação, acesso à plataforma e processamento de pagamentos. Ao utilizar o login social (Google), recebemos também seu nome e foto de perfil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">2. Uso dos Dados</h2>
            <p>
              Seus dados são utilizados para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processar sua assinatura e pagamentos via Asaas.</li>
              <li>Personalizar sua experiência com o Preceptor IA.</li>
              <li>Enviar códigos de recuperação de senha e atualizações importantes do serviço.</li>
              <li>Manter seu histórico de desempenho e progresso nos estudos.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">3. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo criptografia de senhas (hash) e conexões seguras (HTTPS). Suas informações de cartão de crédito são processadas diretamente pelo Asaas e não ficam armazenadas em nossos servidores.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados para terceiros. O compartilhamento ocorre apenas com serviços essenciais para o funcionamento da plataforma (Asaas para pagamentos e Google AI para as interações inteligentes).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">5. Seus Direitos (LGPD)</h2>
            <p>
              Você tem o direito de solicitar a exclusão de seus dados, retificação ou acesso às informações armazenadas a qualquer momento, conforme previsto na Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">6. Contato</h2>
            <p>
              Para questões sobre privacidade, entre em contato através do nosso canal de suporte oficial no WhatsApp.
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
