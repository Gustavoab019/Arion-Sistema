"use client";

import { CheckCircle2, X, AlertCircle, Info } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: {
    container: "bg-white border-2 border-emerald-200",
    iconBg: "bg-emerald-100",
    icon: "text-emerald-600",
    text: "text-slate-900",
    subtext: "text-slate-500",
    progress: "bg-emerald-500",
  },
  error: {
    container: "bg-white border-2 border-red-200",
    iconBg: "bg-red-100",
    icon: "text-red-600",
    text: "text-slate-900",
    subtext: "text-slate-500",
    progress: "bg-red-500",
  },
  info: {
    container: "bg-white border-2 border-slate-200",
    iconBg: "bg-slate-100",
    icon: "text-slate-600",
    text: "text-slate-900",
    subtext: "text-slate-500",
    progress: "bg-slate-500",
  },
};

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = ICONS[type];
  const styles = STYLES[type];

  useEffect(() => {
    // Animar entrada
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Progresso
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    // Iniciar saída
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration - 300);

    // Remover
    const removeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${styles.container} ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-semibold ${styles.text}`}>
            {type === "success" && "Sucesso"}
            {type === "error" && "Erro"}
            {type === "info" && "Informação"}
          </p>
          <p className={`text-sm mt-0.5 ${styles.subtext}`}>{message}</p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full transition-all duration-100 ${styles.progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Hook para gerenciar toasts
type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = useCallback(() => (
    <div className="fixed top-4 right-4 flex flex-col gap-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  ), [toasts, removeToast]);

  return { showToast, ToastContainer };
}
