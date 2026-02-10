
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Icons } from '../constants';
import { User, UserRole } from '../types';

interface LandingProps {
    user: User | null;
}

export const Landing: React.FC<LandingProps> = ({ user }) => {
    const navigate = useNavigate();

    const handleEnter = () => {
        if (user) {
            if (user.role === UserRole.STAFF || user.role === UserRole.HOST || user.role === UserRole.ADMIN) {
                navigate('/client/events');
            } else {
                navigate('/app');
            }
        } else {
            navigate('/auth');
        }
    };

    return (
        <Layout activeTab="explore" isLoggedIn={!!user} onTabChange={() => { }}>
            <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 text-center space-y-16 animate-in fade-in duration-700">

                {/* Hero Section */}
                <div className="space-y-6 flex flex-col items-center max-w-lg">
                    <div className="text-blue-500 scale-[3] mb-6 animate-pulse">
                        <Icons.Symbol />
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">
                        phase0
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.3em] max-w-xs leading-relaxed">
                        Operating system for informal events
                    </p>
                </div>

                {/* Feature Grid / Info (Minimal) */}
                <div className="grid gap-8 w-full max-w-sm">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <Icons.Ticket />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            Secure Ticketing
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <Icons.QrCode />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            Identity Proof
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full max-w-sm space-y-6">
                    <button
                        onClick={handleEnter}
                        className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:bg-zinc-200 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <span>{user ? 'Open Dashboard' : 'Enter System'}</span>
                        <span className="text-lg">→</span>
                    </button>

                    {!user && (
                        <button
                            onClick={() => navigate('/auth')}
                            className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors"
                        >
                            Login / Sign Up
                        </button>
                    )}

                    {user && (
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            Logged in as {user.name}
                        </p>
                    )}
                </div>

            </div>
        </Layout>
    );
};
