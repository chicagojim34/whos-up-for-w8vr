import React from 'react';
import cx from 'classnames';
import { GlassModal } from './GlassModal';
import type { ConfirmRequest } from '../hooks/useConfirm';

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ request, onConfirm, onCancel }) => (
  <GlassModal
    isOpen={request !== null}
    onClose={onCancel}
    title={request?.title ?? ''}
    maxWidth="sm"
  >
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-medium leading-relaxed">{request?.body}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn bg-surface-high text-text-dark flex-1 py-3">
          {request?.cancelLabel ?? 'Cancel'}
        </button>
        <button
          onClick={onConfirm}
          className={cx(
            'btn flex-1 py-3',
            request?.tone === 'danger'
              ? 'bg-error text-white hover:brightness-110'
              : 'btn-primary'
          )}
        >
          {request?.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </div>
  </GlassModal>
);
