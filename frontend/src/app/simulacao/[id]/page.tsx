"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Mic, MicOff, Send, Activity, User, Bot, CheckCircle } from "lucide-react";

interface ChatTurn {
  role: string;
  text: string;
}

export default function Simulacao() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalTextBuffer, setFinalTextBuffer] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [caseData, setCaseData] = useState<{ title: string; description: string } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAISpeakingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const historyRef = useRef<ChatTurn[]>([]);
  useEffect(() => {
      historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:8000/sessions/${id}`)
        .then((res) => {
            setHistory(res.data.history || []);
            if (res.data.case_data) {
                setCaseData(res.data.case_data);
            }
        })
        .catch(err => console.error("Error loading session:", err));
    }
  }, [id]);

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
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }

      try {
        const res = await axios.post("http://localhost:8000/chat", {
          session_id: id,
          message: { text: textToSend }
        });
        
        const replyText = res.data.reply;
        setHistory([...newHistory, { role: "model", text: replyText }]);
        speakText(replyText);
      } catch (err) {
        console.error("Erro no envio da mensagem", err);
        if (!isAISpeakingRef.current) startMic();
      } finally {
        setLoadingReply(false);
      }
    };
  }, [loadingReply, id]);

  useEffect(() => {
    scrollToBottom();
  }, [history, finalTextBuffer, interimText, loadingReply]);

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

  const isManuallyMutedRef = useRef(false);

  const startMic = () => {
      // Prevent double starts
      if (recognitionRef.current && !isAISpeakingRef.current && window.speechSynthesis.speaking === false && !isManuallyMutedRef.current) {
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "pt-BR";

      rec.onstart = () => setIsRecording(true);
      
      rec.onend = () => {
          setIsRecording(false);
          // Keep it running continuously if we didn't deliberately stop
          if (!isAISpeakingRef.current && !loadingReply && !isManuallyMutedRef.current) {
             setTimeout(() => {
                 if (!isManuallyMutedRef.current) {
                    try { rec.start(); } catch(e){}
                 }
             }, 300);
          }
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
            setFinalTextBuffer(prev => prev + final);
        }
        setInterimText(interim);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        silenceTimeoutRef.current = setTimeout(() => {
           const full = (currentBufferRef.current.final + " " + interim).trim();
           if (full && sendMessageHandlerRef.current && !isAISpeakingRef.current) {
               sendMessageHandlerRef.current(full);
           }
        }, 1500); 
      };

      recognitionRef.current = rec;
      // Boot microphone up automatically at mount!
      startMic();
    }
    
    return () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (recognitionRef.current) recognitionRef.current.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSend = () => {
      const full = (finalTextBuffer + " " + interimText).trim();
      if (full && sendMessageHandlerRef.current) {
          sendMessageHandlerRef.current(full);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
            <h1 className="text-xl font-bold text-slate-800">Simulação de Consulta</h1>
            <p className="text-xs text-slate-500">Microfone contínuo. Fale e aguarde 1.5s, ou envie manualmente.</p>
        </div>
        <button 
          onClick={() => router.push(`/feedback/${id}`)}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Encerrar Consulta
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-6 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
       

        {/* Chat */}
        <div className="col-span-1 md:col-span-2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-y-auto p-4 md:p-8">
          <div className="flex flex-col gap-6">
            {history.length === 0 && !loadingReply && (
              <div className="text-center text-slate-400 py-20 flex flex-col items-center">
                <Bot className="w-16 h-16 mb-4 opacity-50" />
                <p>O paciente está aguardando no consultório.</p>
                <p className="text-sm">Apenas comece a falar. O microfone já deve estar ativo.</p>
              </div>
            )}

            {history.map((turn, idx) => {
              const isUser = turn.role === "user";
              return (
                <div key={idx} className={`flex gap-4 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${isUser ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none"}`}>
                    <p className="leading-relaxed">{turn.text}</p>
                  </div>
                </div>
              );
            })}

            {(finalTextBuffer || interimText) && (
               <div className="flex gap-4 max-w-[85%] self-end flex-row-reverse opacity-70">
                  <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-400 text-white rounded-tr-none italic transition-all">
                    {finalTextBuffer} <span className="text-white/80">{interimText}...</span>
                  </div>
               </div>
            )}

            {loadingReply && (
              <div className="flex gap-4 max-w-[85%] self-start">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-500 rounded-tl-none shadow-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  Paciente processando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

         {/* Painel do Caso */}
        <div className="hidden md:flex flex-col bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-y-auto">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Estudo de Caso</h2>
           {caseData ? (
             <>
               <h3 className="text-xl font-extrabold text-slate-800 mb-3">{caseData.title}</h3>
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                 <p className="text-blue-900 leading-relaxed text-sm">{caseData.description}</p>
               </div>
               <p className="text-xs text-slate-500 italic mt-auto">Você é o médico avaliador. Conduza o paciente e investigue os sintomas até o diagnóstico, prescrevendo o que for necessário ao final.</p>
             </>
           ) : (
             <div className="animate-pulse space-y-4 mt-2">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-20 bg-slate-200 rounded w-full"></div>
             </div>
           )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
           <button
            onClick={toggleMute}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              isRecording ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            {isRecording ? <Mic className="w-5 h-5 fill-current animate-pulse" /> : <MicOff className="w-5 h-5" />}
            {isRecording ? "Microfone Escutando" : "Microfone Mutado"}
          </button>
          
          <p className="text-slate-400 text-xs text-center hidden md:block">
            Você pode apenas <strong>Pausar 1.5s</strong> para Auto-Enviar.
          </p>

          <button
            onClick={handleManualSend}
            disabled={!finalTextBuffer && !interimText}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
            Enviar Mensagem
          </button>
        </div>
      </footer>
    </div>
  );
}
