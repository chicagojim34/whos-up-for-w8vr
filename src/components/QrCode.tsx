import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  /** Described to screen readers — the code itself is decorative to them. */
  label: string;
}

/**
 * Rendered locally rather than fetched as an image from api.qrserver.com:
 * an invite that only works when a third-party image host is reachable is not
 * an invite. Also keeps the invite URL off someone else's request logs.
 */
export const QrCode: React.FC<QrCodeProps> = ({ value, size = 180, className, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: '#191c1d', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(() => !cancelled && setFailed(false))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        role="img"
        aria-label={label}
      >
        <div className="w-full h-full flex items-center justify-center bg-surface-low rounded-2xl text-xs text-text-light text-center p-4">
          Could not draw the code — use the link below instead.
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    />
  );
};
