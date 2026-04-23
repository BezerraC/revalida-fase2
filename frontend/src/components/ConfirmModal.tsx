"use client";

import React from "react";
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "info",
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      bgIcon: "bg-red-50",
      btnConfirm: "bg-red-600 hover:bg-red-700 shadow-red-100",
      border: "border-red-100",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      bgIcon: "bg-amber-50",
      btnConfirm: "bg-amber-600 hover:bg-amber-700 shadow-amber-100",
      border: "border-amber-100",
    },
    info: {
      icon: <Info className="w-6 h-6 text-indigo-600" />,
      bgIcon: "bg-indigo-50",
      btnConfirm: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
      border: "border-indigo-100",
    },
    success: {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      bgIcon: "bg-emerald-50",
      btnConfirm: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
      border: "border-emerald-100",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
             <div className={`w-12 h-12 ${config.bgIcon} rounded-2xl flex items-center justify-center`}>
                {config.icon}
             </div>
             <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
             >
                <X size={20} />
             </button>
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col gap-3">
             <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full ${config.btnConfirm} text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg`}
             >
                {confirmText}
             </button>
             <button
                onClick={onClose}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-all"
             >
                {cancelText}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
