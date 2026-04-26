import React from "react";
import Link from "next/link";
import { Mail, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand and Description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-white">
                MedMaster
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              A plataforma definitiva para sua preparação para a segunda fase do Revalida.
              Simulados realistas, temas classificados e acompanhamento de desempenho.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Plataforma</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/fase1" className="text-sm hover:text-indigo-400 transition-colors">Fase 1 - Objetiva</Link>
              </li>
              <li>
                <Link href="/fase2" className="text-sm hover:text-indigo-400 transition-colors">Fase 2 - Prática</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Recursos</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/historico" className="text-sm hover:text-indigo-400 transition-colors">Histórico de Provas</Link>
              </li>
              <li>
                <Link href="https://wa.me/5596984176164" className="text-sm hover:text-indigo-400 transition-colors">Suporte</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/termos" className="text-sm hover:text-indigo-400 transition-colors">Termos de Uso</Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-sm hover:text-indigo-400 transition-colors">Política de Privacidade</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {currentYear} MedMaster. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Feito com</span>
            <Heart size={12} className="text-red-500 fill-red-500" />
            <span>para médicos revalidantes.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
