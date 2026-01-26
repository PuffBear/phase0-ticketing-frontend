
import React from 'react';
import { Icons } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'explore' | 'wallet' | 'profile';
  onTabChange: (tab: 'explore' | 'wallet' | 'profile') => void;
  isLoggedIn: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isLoggedIn }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a] px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onTabChange('explore')}
          className="flex items-center gap-3"
          aria-label="Go to Explore"
        >
          <div className="text-blue-500 flex items-center justify-center">
            <Icons.Symbol />
          </div>
          <span className="font-extrabold tracking-tighter text-sm uppercase tracking-[0.2em] text-zinc-100">phase0</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav - Only if logged in */}
      {isLoggedIn && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-[#27272a] flex justify-around items-center px-4 py-4 safe-area-bottom">
          <button 
            onClick={() => onTabChange('explore')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'explore' ? 'text-blue-500' : 'text-[#71717a]'}`}
          >
            <Icons.Layout />
            <span className="text-[9px] font-black uppercase tracking-widest">Explore</span>
          </button>
          <button 
            onClick={() => onTabChange('wallet')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'wallet' ? 'text-blue-500' : 'text-[#71717a]'}`}
          >
            <Icons.Ticket />
            <span className="text-[9px] font-black uppercase tracking-widest">Wallet</span>
          </button>
          <button 
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'profile' ? 'text-blue-500' : 'text-[#71717a]'}`}
          >
            <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center overflow-hidden">
              <div className="w-3 h-3 bg-current rounded-full translate-y-2"></div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Account</span>
          </button>
        </nav>
      )}
    </div>
  );
};
