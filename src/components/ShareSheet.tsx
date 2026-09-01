import React from 'react';
import { Copy, Share2 } from 'lucide-react';
import { GlassModal } from './GlassModal';
import { QrCode } from './QrCode';
import { useToast } from '../hooks/useToast';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  /** Absolute URL people will land on. */
  url: string;
  /** Text used when the OS share sheet is available. */
  shareText: string;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  url,
  shareText,
}) => {
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.show('Invite link copied');
    } catch {
      toast.show('Could not copy — select the link and copy it manually', 'warning');
      return;
    }
    onClose();
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url });
      onClose();
    } catch {
      // The user dismissed the OS sheet. Leave the dialog open so they can
      // still copy the link.
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="flex flex-col gap-4 items-center text-center">
        <div className="p-4 bg-surface-lowest rounded-2xl shadow-sm">
          <QrCode value={url} size={180} label={`QR code linking to ${title}`} />
        </div>

        <p className="w-full p-3 bg-surface-low rounded-xl text-xs font-mono text-text-medium break-all">
          {url}
        </p>

        <div className="flex gap-2 w-full">
          <button onClick={copy} className="btn btn-primary flex-1 py-3 flex items-center gap-2">
            <Copy size={16} aria-hidden="true" /> Copy link
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={nativeShare}
              className="btn btn-secondary py-3 px-4 flex items-center gap-2"
            >
              <Share2 size={16} aria-hidden="true" /> Share
            </button>
          )}
        </div>
      </div>
    </GlassModal>
  );
};
