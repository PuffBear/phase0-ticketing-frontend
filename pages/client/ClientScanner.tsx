import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { ClientLayout } from './ClientLayout';

export const ClientScanner: React.FC = () => {
  const { eventId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>('Ready to scan.');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: number | null = null;

    const startScanner = async () => {
      if (!eventId) return;
      if (!('BarcodeDetector' in window)) {
        setError('QR scanning is not supported in this browser.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        interval = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes?.length && !cooldown) {
              const token = barcodes[0].rawValue;
              setStatus('Verifying QR...');
              setCooldown(true);
              await apiPost('/client/scan', { token });
              setStatus('Entry approved. Band issued.');
              setTimeout(() => setCooldown(false), 3000);
            }
          } catch {
            // ignore scan errors
          }
        }, 1200);
      } catch (err) {
        setError('Camera access denied.');
      }
    };

    startScanner();

    return () => {
      if (interval) window.clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [eventId]);

  return (
    <ClientLayout title="Scanner" active="scanner">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114] space-y-4">
          <h2 className="text-sm uppercase tracking-[0.3em] text-zinc-500">QR Scanner</h2>
          <p className="text-xs text-zinc-400">Scan rotating QR codes to approve entry.</p>
          {error ? (
            <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{error}</p>
          ) : (
            <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold">{status}</p>
          )}
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Event: {eventId}</p>
        </div>
        <div className="border border-[#27272a] rounded-2xl p-4 bg-black">
          <video ref={videoRef} className="w-full rounded-xl" muted playsInline />
        </div>
      </div>
    </ClientLayout>
  );
};
