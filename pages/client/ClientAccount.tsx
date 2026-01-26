import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { ClientLayout } from './ClientLayout';
import { User } from '../../types';

interface ClientAccountProps {
  user: User;
  onLogout: () => void;
}

export const ClientAccount: React.FC<ClientAccountProps> = ({ user, onLogout }) => {
  const [scans, setScans] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await apiGet<{ scannedCount: number }>('/client/account');
        setScans(result.scannedCount);
      } catch {
        setScans(0);
      }
    };
    load();
  }, []);

  return (
    <ClientLayout title="Account" active="account">
      <div className="space-y-6">
        <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114]">
          <h2 className="text-lg font-black uppercase tracking-widest">{user.name}</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">{user.email}</p>
          <p className="text-xs text-blue-500 uppercase tracking-widest mt-2">Role: {user.role}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114] text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Approved by you</p>
            <p className="text-2xl font-black text-green-400">{scans}</p>
          </div>
          <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114] text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Shift Status</p>
            <p className="text-2xl font-black text-blue-400">Active</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-widest font-bold py-3 rounded-xl"
        >
          Logout
        </button>
      </div>
    </ClientLayout>
  );
};
