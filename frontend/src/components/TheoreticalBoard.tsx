"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Image as ImageIcon, Sparkles, Wand2, AlertCircle } from "lucide-react";

interface TheoreticalBoardProps {
  content: string;
}

export default function TheoreticalBoard({ content }: TheoreticalBoardProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fullTextRef = useRef("");

  // Extrair o tema principal do conteúdo (primeiro H1)
  const getTopic = () => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : "";
  };

  const handleSearchImages = () => {
    const topic = getTopic();
    const query = topic ? `${topic} sinais clínicos medicina inep` : "sinais clínicos medicina inep";
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, "_blank");
  };

  useEffect(() => {
    if (!content) {
      setDisplayedText("");
      return;
    }

    if (content === fullTextRef.current) return;

    fullTextRef.current = content;
    setIsTyping(true);

    let currentPos = 0;
    const speed = content.length > 500 ? 5 : 15;
    
    setDisplayedText("");
    
    const interval = setInterval(() => {
      if (currentPos < content.length) {
        setDisplayedText(content.substring(0, currentPos + 1));
        currentPos++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
            <BookOpen className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Lousa Teórica</h1>
            <p className="text-sm font-medium text-slate-500">
              {getTopic() || "Documentação Clínica"}
            </p>
          </div>
        </div>
        
        {isTyping && (
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 border border-indigo-200 rounded-full">
              <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600">Atualizando...</span>
           </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth bg-white">
        {!content ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <BookOpen className="w-16 h-16 opacity-30" />
            <p className="font-medium text-lg">A lousa está vazia.</p>
            <p className="text-sm max-w-sm text-center">Pergunte algo ao Preceptor no chat ao lado para que ele preencha este quadro com o mapa mental da doença!</p>
          </div>
        ) : (
          <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-700  mb-4 mt-8 bg-indigo-50 px-4 py-2 rounded-lg inline-block border border-indigo-100" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 text-slate-700 text-lg leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 marker:text-indigo-500" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2 marker:text-indigo-500 font-medium" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                blockquote: ({node, children, ...props}) => {
                  // Extrair texto de forma recursiva dos children
                  const extractText = (nodes: any): string => {
                    if (typeof nodes === 'string') return nodes;
                    if (Array.isArray(nodes)) return nodes.map(extractText).join('');
                    if (nodes?.props?.children) return extractText(nodes.props.children);
                    return '';
                  };

                  const textContent = extractText(children);
                  const isImportant = textContent.includes("[!IMPORTANT]");
                  
                  if (isImportant) {
                    return (
                      <div className="my-8 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 font-black uppercase tracking-wider text-sm">
                          <AlertCircle className="w-5 h-5" />
                          Alerta Revalida
                        </div>
                        <div className="text-amber-900 italic font-medium leading-relaxed">
                          {textContent.replace("[!IMPORTANT] Alerta Revalida", "").replace("[!IMPORTANT]", "").trim()}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <blockquote className="border-l-4 border-slate-200 pl-6 my-8 italic text-slate-600" {...props}>
                      {children}
                    </blockquote>
                  );
                },
                table: ({node, ...props}) => (
                  <div className="my-8 overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                    <table className="w-full border-collapse bg-white text-sm" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 text-left font-bold text-slate-700 border-b border-slate-200" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 border-b border-slate-100 text-slate-600" {...props} />,
              }}
            >
              {displayedText}
            </ReactMarkdown>

            {isTyping && <span className="inline-block w-2 h-5 bg-indigo-400 ml-1 animate-pulse" />}

            {!isTyping && (
              <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center text-center">
                <p className="text-slate-500 font-medium mb-4 text-sm">
                  Visualizar imagens de {getTopic() || "referência"}?
                </p>
                <button 
                  onClick={handleSearchImages}
                  className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-700 transition-colors shadow-md active:scale-95 transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  Buscar Imagens de {getTopic() || "Referência"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
