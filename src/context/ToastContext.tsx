import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (
    type: ToastMessage['type'],
    message: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastMessage['type'],
      message: string,
      description?: string,
      action?: { label: string; onClick: () => void }
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, message, description, action };
      setToasts((prev) => [...prev, newToast]);

      // Longer duration if an interactive action is present (6s instead of 4s)
      const timeoutMs = action ? 6000 : 4000;
      setTimeout(() => {
        removeToast(id);
      }, timeoutMs);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Accessible Toast notification container */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[16px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] animate-page-enter transition-all"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-[#1F8FA6] dark:text-[#5FD3E8]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111312] dark:text-[#F2F6F7]">{toast.message}</p>
              {toast.description && (
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">{toast.description}</p>
              )}
              {toast.action && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-[#1F8FA6] dark:text-[#5FD3E8] bg-[#1F8FA6]/10 hover:bg-[#1F8FA6]/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#8C928E] hover:text-[#111312] dark:text-[#5F6C70] dark:hover:text-[#F2F6F7] p-1 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
