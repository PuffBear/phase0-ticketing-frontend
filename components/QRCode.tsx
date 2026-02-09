
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  data: string;
  size?: number;
  refreshMs?: number;
}

export const RotatingQRCode: React.FC<QRCodeProps> = ({ data, size = 192, refreshMs = 15000 }) => {
  const [progress, setProgress] = useState(100);
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const clampedRefreshMs = Math.max(1000, refreshMs);
      const next = Math.max(0, 100 - (elapsed / clampedRefreshMs) * 100);
      setProgress(next);
    }, 100);
    return () => {
      clearInterval(timer);
    };
  }, [data, refreshMs]);

  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      try {
        const url = await QRCode.toDataURL(data, {
          errorCorrectionLevel: 'M',
          width: size,
          margin: 2
        });
        if (!cancelled) setQrSrc(url);
      } catch {
        if (!cancelled) setQrSrc('');
      }
    };
    build();
    return () => {
      cancelled = true;
    };
  }, [data, size]);

  return (
    <div className="relative p-4 bg-white rounded-xl shadow-inner group">
      {qrSrc ? (
        <img src={qrSrc} width={size} height={size} alt="Ticket QR code" className="rounded-md" />
      ) : (
        <div className="w-48 h-48 flex items-center justify-center text-xs text-zinc-500">QR loading...</div>
      )}
      
      {/* Loading bar for rotation */}
      <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 p-1 rounded backdrop-blur-sm pointer-events-none">
        <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center text-[8px] font-bold text-white">0</div>
      </div>
    </div>
  );
};
