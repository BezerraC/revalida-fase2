"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Mic, MicOff, Send, Activity, User, Bot, BookOpen, ArrowLeft, Image as ImageIcon, Key } from "lucide-react";
import ReactMarkdown from "react-markdown";
import TheoreticalBoard from "@/components/TheoreticalBoard";
import toast from "react-hot-toast";

interface ChatTurn {
  role: string;
  text: string;
}

export default function Fase1Tutor() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [documentContent, setDocumentContent] = useState("");
  
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalTextBuffer, setFinalTextBuffer] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAISpeakingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };
  
  const historyRef = useRef<ChatTurn[]>([]);
  useEffect(() => {
      historyRef.current = history;
  }, [history]);

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const init = async () => {
        if (!id) return;
        
        try {
            const res = await api.get(`/fase1/sessions/${id}`);
            setHistory(res.data.history || []);
            setDocumentContent(res.data.document || "");
        } catch (err) {
            console.error("Error loading session:", err);
            toast.error("Sessão não encontrada.");
            router.push("/");
        }
    };
    init();
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  const sendMessageHandlerRef = useRef<((txt: string) => void) | null>(null);

  useEffect(() => {
    sendMessageHandlerRef.current = async (textToSend: string) => {
      if (!textToSend.trim() || loadingReply) return;
      
      setFinalTextBuffer("");
      setInterimText("");
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      const newHistory = [...historyRef.current, { role: "user", text: textToSend }];
      setHistory(newHistory);
      setLoadingReply(true);
      isFetchingRef.current = true;
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }

      try {
        const res = await api.post("/fase1/chat", {
          session_id: id,
          message: { text: textToSend }
        });
        
        const replyText = res.data.reply;
        const newDoc = res.data.document;
        
        setHistory([...newHistory, { role: "model", text: replyText }]);
        if (newDoc) {
            setDocumentContent(newDoc);
        }
        
        speakText(replyText);
      } catch (err: any) {
        console.error("Erro no envio da mensagem", err);
        
        if (err.response?.status === 403) {
          setShowApiKeyWarning(true);
        }

        const errorMsg = err.response?.data?.detail || "Ocorreu um erro de conexão com o Tutor IA. Tente novamente em instantes.";
        // Adiciona o erro diretamente no histórico de mensagens do chat como se fosse o tutor avisando o problema
        setHistory(prev => [...prev, { role: "model", text: `❌ ${errorMsg}` }]);
        
        isFetchingRef.current = false;
        if (!isAISpeakingRef.current) startMic();
      } finally {
        isFetchingRef.current = false;
        setLoadingReply(false);
      }
    };
  }, [loadingReply, id]);

  useEffect(() => {
    scrollToBottom();
  }, [history, loadingReply]);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
      if (ptVoice) utterance.voice = ptVoice;

      utterance.onstart = () => {
        isAISpeakingRef.current = true;
        if (recognitionRef.current) recognitionRef.current.stop();
      };

      utterance.onend = () => {
        isAISpeakingRef.current = false;
        startMic();
      };
      
      utterance.onerror = () => {
         isAISpeakingRef.current = false;
         startMic();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const isManuallyMutedRef = useRef(true);

  const startMic = () => {
      if (recognitionRef.current && !isAISpeakingRef.current && window.speechSynthesis.speaking === false && !isManuallyMutedRef.current && !isFetchingRef.current) {
          try {
              recognitionRef.current.start();
          } catch(e) {}
      }
  };

  const stopMic = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  const toggleMute = () => {
      if (isRecording) {
          isManuallyMutedRef.current = true;
          stopMic();
      } else {
          isManuallyMutedRef.current = false;
          startMic();
      }
  };

  const currentBufferRef = useRef({ final: "", interim: "" });
  useEffect(() => {
      currentBufferRef.current = { final: finalTextBuffer, interim: interimText };
  }, [finalTextBuffer, interimText]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onend = () => {
        setIsRecording(false);
        if (!isAISpeakingRef.current && !isFetchingRef.current && !isManuallyMutedRef.current) {
           setTimeout(() => {
               if (!isManuallyMutedRef.current && !isFetchingRef.current) {
                  try { recognition.start(); } catch(e){}
               }
           }, 300);
        }
    };
    
    recognition.onerror = (e: any) => {
        console.error("Speech recognition error", e.error);
        if(e.error === 'not-allowed') {
            isManuallyMutedRef.current = true;
            setIsRecording(false);
        }
    };

    recognition.onresult = (event: any) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
          setFinalTextBuffer(prev => {
              const newFinal = prev + " " + final;
              return newFinal;
          });
      }
      setInterimText(interim);

      silenceTimeoutRef.current = setTimeout(() => {
          const { final: currentFinal, interim: currentInterim } = currentBufferRef.current;
          const merged = (currentFinal + " " + currentInterim).trim();
          if (merged && sendMessageHandlerRef.current) {
             sendMessageHandlerRef.current(merged);
          }
      }, 1500);
    };

    setTimeout(startMic, 500);

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleManualSend = () => {
      const merged = (finalTextBuffer + " " + interimText).trim();
      if (merged && sendMessageHandlerRef.current) {
          sendMessageHandlerRef.current(merged);
      }
  };

  const handleGoogleImages = () => {
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent("sinais clinicos doenca inep medicina")}`, "_blank");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT PANEL - CHAT TUTOR */}
      <div className="flex flex-col w-full md:w-1/2 border-r border-slate-200 bg-white">
        
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={() => {
                window.speechSynthesis.cancel();
                router.push("/");
             }} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                 <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
               <Bot className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h2 className="font-bold text-slate-800 leading-tight">Preceptor IA</h2>
               <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${
                      loadingReply ? "bg-amber-500 animate-bounce" : 
                      isRecording ? "bg-green-500 animate-pulse" : 
                      "bg-slate-300"
                  }`}></div>
                  <span className="text-xs text-slate-500 font-medium">
                      {loadingReply ? "Analisando..." : isRecording ? "Ouvindo..." : "Em espera"}
                  </span>
               </div>
             </div>
          </div>
          
          <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-all ${
                  isRecording 
                      ? "bg-red-50 text-red-500 hover:bg-red-100" 
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
          >
              {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scroll-smooth custom-scrollbar [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        >
          
          <div className="flex w-full justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white border border-slate-200 shadow-sm text-slate-700">
                  <p className="font-medium text-slate-800 flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-blue-500" /> Preceptor
                  </p>
                  Olá! Sou seu preceptor focado no Revalida Fase 1. Fale pelo microfone qual doença, sintoma ou tema você quer discutir!
              </div>
          </div>

          {history.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === "user" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                      : "bg-white border border-slate-200 text-slate-700 shadow-sm"
              }`}>
                {msg.role !== "user" && (
                    <p className="font-medium text-slate-800 flex items-center gap-2 mb-1">
                        <Bot className="w-4 h-4 text-blue-500" /> Preceptor
                    </p>
                )}
                <div className="leading-relaxed font-medium">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {(finalTextBuffer || interimText) && (
             <div className="flex w-full justify-end">
                <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-blue-500 text-white shadow-md opacity-70">
                   <div className="leading-relaxed font-medium">
                      {(finalTextBuffer + " " + interimText).trim()}
                   </div>
                </div>
             </div>
          )}

          {loadingReply && (
            <div className="flex w-full justify-start">
               <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-slate-500 font-medium text-sm">Organizando materiais...</span>
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 z-10 shrink-0">
           <div className="flex items-center gap-2">
              <button
                 onClick={toggleMute}
                 title="Ligar/Desligar Microfone"
                 className={`p-4 shrink-0 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                     isRecording 
                         ? "bg-red-500 text-white shadow-red-200 hover:bg-red-600 animate-pulse" 
                         : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                 }`}
              >
                  {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <div className="relative flex items-center w-full">
                 <input
                    type="text"
                    value={interimText ? (finalTextBuffer + " " + interimText).trim() : finalTextBuffer}
                    onChange={(e) => setFinalTextBuffer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleManualSend(); }}
                    placeholder={isRecording ? "Pode falar, estou te ouvindo..." : "Escreva sua dúvida ou ligue o microfone."}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-4 pr-14 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder-slate-400"
                 />
                 <button
                    onClick={handleManualSend}
                    disabled={loadingReply || !(finalTextBuffer + " " + interimText).trim()}
                    className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                 >
                    <Send className="w-5 h-5" />
                 </button>
              </div>
           </div>
           <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              Fale pelo microfone e o painel à direita será atualizado automaticamente com um resumo padrão Inep.
           </p>
        </div>
      </div>

      {/* RIGHT PANEL - DOCUMENT VIEWER */}
      <div className="hidden md:flex flex-col w-1/2 bg-white relative">
         <TheoreticalBoard 
            content={documentContent} 
         />
      </div>
      
      {showApiKeyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-slate-100 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Configuração Necessária</h2>
            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
              O Tutor IA requer que você configure sua própria chave de API do Gemini no seu perfil para funcionar.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push("/perfil")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                Configurar no Perfil
              </button>
              <button 
                onClick={() => router.push("/")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
