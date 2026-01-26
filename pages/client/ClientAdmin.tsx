import React from 'react';
import { ClientLayout } from './ClientLayout';

export const ClientAdmin: React.FC = () => {
  return (
    <ClientLayout title="Admin" active="admin">
      <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114]">
        <h2 className="text-xl font-black uppercase tracking-widest">Analytics Dashboard</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">
          Admin analytics will be wired here.
        </p>
      </div>
    </ClientLayout>
  );
};
