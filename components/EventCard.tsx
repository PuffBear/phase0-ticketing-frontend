
import React from 'react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const totalCapacity = event.tiers.reduce((acc, t) => acc + t.capacity, 0);
  const totalSold = event.tiers.reduce((acc, t) => acc + t.sold_count, 0);
  const isSoldOut = totalSold >= totalCapacity;

  return (
    <div 
      onClick={() => onSelect(event)}
      className="group relative bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden hover:border-blue-500 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-black/40"
    >
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Node Sequence</span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">ID: {event.id.slice(-6).toUpperCase()}</span>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.15em] ${isSoldOut ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {isSoldOut ? 'Max Capacity' : 'Secure Entry Active'}
          </span>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-extrabold text-2xl leading-tight group-hover:text-blue-400 transition-colors tracking-tighter uppercase italic">{event.title}</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
            {event.location}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">Timestamp</span>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">
                {new Date(event.start_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">Payload</span>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">{totalSold} Verified Guests</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Infrastructure-style capacity/load bar */}
      <div className="h-2 w-full bg-[#111114] flex items-center px-1 border-t border-[#27272a]">
        <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
          <div 
            className={`h-full ${isSoldOut ? 'bg-red-500' : 'bg-blue-600'} shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out rounded-full`} 
            style={{ width: `${(totalSold / totalCapacity) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Minimalist "System" corner accents */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-white translate-x-1/2 -translate-y-1/2 rotate-45"></div>
      </div>
    </div>
  );
};
