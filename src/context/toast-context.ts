import { createContext } from 'react';

export type ToastTone = 'success' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastApi | undefined>(undefined);
