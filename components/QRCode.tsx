
import React, { useState, useEffect } from 'react';

interface QRCodeProps {
  data: string;
}

export const RotatingQRCode: React.FC<QRCodeProps> = ({ data }) => {
  const [nonce, setNonce] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setNonce(n => n + 1);
      setProgress(100);
    }, 5000);

    const timer = setInterval(() => {
      setProgress(p => Math.max(0, p - 2));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Simplified "QR" visualization for simulation
  return (
    <div className="relative p-4 bg-white rounded-xl shadow-inner group">
      <div className="grid grid-cols-8 gap-1 w-48 h-48 opacity-90 transition-all duration-300">
        {Array.from({ length: 64 }).map((_, i) => {
          const isActive = (Math.sin(i * (nonce + 1)) + Math.cos(i * (data.length))) > 0;
          return (
            <div 
              key={i} 
              className={`w-full h-full rounded-[1px] ${isActive ? 'bg-zinc-950' : 'bg-transparent'}`} 
            />
          );
        })}
      </div>
      
      {/* Loading bar for rotation */}
      <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 p-1 rounded backdrop-blur-sm pointer-events-none">
        <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center text-[8px] font-bold text-white">0</div>
      </div>
    </div>
  );
};
