import React from 'react';
import { Layout } from '../../components/Layout';
import { Icons } from '../../constants';

interface ClientLoginProps {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const ClientLogin: React.FC<ClientLoginProps> = ({
  email,
  password,
  isSubmitting,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit
}) => {
  return (
    <Layout activeTab="profile" onTabChange={() => {}} isLoggedIn={false}>
      <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
        <div className="space-y-4">
          <div className="text-blue-500 scale-[2] origin-left mb-2">
            <Icons.Symbol />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Client Access</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Staff + host login</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="staff@example.com or adminphase0"
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? '...' : 'Login'}
          </button>
        </form>
        <p className="text-[10px] text-zinc-700 text-center font-bold uppercase tracking-widest">
          Restricted operations console.
        </p>
      </div>
    </Layout>
  );
};
