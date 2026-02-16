import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { ClientLayout } from './ClientLayout';

interface ScanResult {
  ticketId?: string;
  ticket?: {
    id?: string;
    ticketId?: string;
    code?: string;
  };
}

interface LastScanEntry {
  ticket: string;
  action: 'in' | 'out';
  at: string;
}

const getCameraErrorMessage = (err: unknown): string | null => {
  if (!(err instanceof DOMException)) {
    return 'Unable to start camera.';
  }
  if (err.name === 'AbortError') {
    return null;
  }
  if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
    return 'Camera access denied.';
  }
  if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
    return 'No compatible camera found.';
  }
  if (err.name === 'NotReadableError') {
    return 'Camera is busy in another app.';
  }
  return 'Unable to start camera.';
};

export const ClientScanner: React.FC = () => {
  const { eventId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingTokenRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const actionRef = useRef<'in' | 'out'>('in');
  const [status, setStatus] = useState<string>('Ready to scan.');
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'in' | 'out'>('in');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScan, setLastScan] = useState<LastScanEntry | null>(null);

  useEffect(() => {
    pendingTokenRef.current = pendingToken;
  }, [pendingToken]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

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
        setError(null);

        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        interval = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes?.length && !pendingTokenRef.current && !isSubmittingRef.current) {
              const token = barcodes[0].rawValue;
              if (!token) return;
              setError(null);
              setPendingToken(token);
              setStatus(`QR recognized. Confirm ${actionRef.current === 'in' ? 'check-in' : 'check-out'}.`);
            }
          } catch {
            // ignore scan errors
          }
        }, 1200);
      } catch (err) {
        const message = getCameraErrorMessage(err);
        if (message) setError(message);
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

  const handleConfirm = async () => {
    if (!eventId || !pendingToken || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setStatus(`${action === 'in' ? 'Checking in' : 'Checking out'}...`);
    try {
      const response = await apiPost<ScanResult>('/client/scan', {
        token: pendingToken,
        eventId,
        action
      });
      const ticket =
        response.ticketId ||
        response.ticket?.ticketId ||
        response.ticket?.id ||
        response.ticket?.code ||
        `${pendingToken.slice(0, 8)}...`;

      setLastScan({
        ticket,
        action,
        at: new Date().toLocaleTimeString()
      });
      setStatus(action === 'in' ? 'Checked in.' : 'Checked out.');
      setPendingToken(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${action === 'in' ? 'Check-in' : 'Check-out'} failed: ${err.message}`
          : `${action === 'in' ? 'Check-in' : 'Check-out'} failed.`
      );
      setStatus('Ready to scan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanNext = () => {
    setPendingToken(null);
    setError(null);
    setStatus('Ready to scan.');
  };

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Action</p>
            <div className="inline-flex rounded-lg border border-[#27272a] overflow-hidden">
              <button
                type="button"
                onClick={() => setAction('in')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition ${
                  action === 'in' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                In
              </button>
              <button
                type="button"
                onClick={() => setAction('out')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition ${
                  action === 'out' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Out
              </button>
            </div>
          </div>
          {pendingToken && (
            <div className="border border-[#27272a] rounded-xl p-3 bg-[#18181b] space-y-3">
              <p className="text-[10px] text-zinc-300 uppercase tracking-widest">QR recognized</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Ready to {action === 'in' ? 'check in' : 'check out'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-black text-[10px] uppercase tracking-widest font-black py-2 rounded-lg disabled:opacity-60"
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${action}`}
                </button>
                <button
                  type="button"
                  onClick={handleScanNext}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-[#27272a] text-zinc-300 text-[10px] uppercase tracking-widest rounded-lg disabled:opacity-60"
                >
                  Scan next
                </button>
              </div>
            </div>
          )}
          {lastScan && (
            <div className="border border-[#27272a] rounded-xl p-3 bg-[#18181b] space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Last Scan</p>
              <p className="text-xs text-zinc-200">
                {lastScan.ticket} · {lastScan.action === 'in' ? 'Checked in' : 'Checked out'} · {lastScan.at}
              </p>
            </div>
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
