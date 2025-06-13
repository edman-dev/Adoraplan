import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastFunction {
  (props: Omit<Toast, 'id'>): void;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast: ToastFunction = useCallback(({ title, description, variant = 'default' }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);
    
    // Simple implementation: just console log for now
    if (variant === 'destructive') {
      console.error(`Toast Error: ${title}`, description);
    } else {
      console.log(`Toast: ${title}`, description);
    }
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toast, toasts };
}