"use client";
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, message, type };
  toasts = [...toasts, newToast];
  notifyListeners();
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

export function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  notifyListeners();
}

export default function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur border min-w-[300px] max-w-md transition-all duration-300 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-green-900/90 border-green-500/50 text-green-100'
              : 'bg-red-900/90 border-red-500/50 text-red-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="flex-shrink-0" size={20} />
          )}
          <p className="flex-1 text-sm font-light">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

