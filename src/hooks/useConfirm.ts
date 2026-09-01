import { useCallback, useRef, useState } from 'react';

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

/**
 * Replaces window.confirm(), which cannot be styled and breaks the glass
 * language everywhere it appears. `ask()` resolves to the user's choice.
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback((req: ConfirmRequest) => {
    setRequest(req);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    setRequest(null);
    resolver.current?.(ok);
    resolver.current = null;
  }, []);

  return {
    ask,
    dialogProps: {
      request,
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    },
  };
}
