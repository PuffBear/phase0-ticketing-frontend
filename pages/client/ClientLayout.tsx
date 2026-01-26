import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';

interface ClientLayoutProps {
  children: React.ReactNode;
  title: string;
  active: 'events' | 'scanner' | 'account' | 'admin';
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children, title, active }) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-blue-500"><Icons.Symbol /></span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Phase0 Client</p>
            <h1 className="text-lg font-black uppercase tracking-widest">{title}</h1>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          <Link className={active === 'events' ? 'text-blue-500' : 'hover:text-zinc-300'} to="/client/events">Events</Link>
          <Link className={active === 'scanner' ? 'text-blue-500' : 'hover:text-zinc-300'} to="/client/scanner">Scanner</Link>
          <Link className={active === 'account' ? 'text-blue-500' : 'hover:text-zinc-300'} to="/client/account">Account</Link>
          <Link className={active === 'admin' ? 'text-blue-500' : 'hover:text-zinc-300'} to="/client/admin">Admin</Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
