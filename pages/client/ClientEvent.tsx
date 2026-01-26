import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, apiPost, API_BASE } from '../../services/api';
import { ClientLayout } from './ClientLayout';

interface Metrics {
  scannedIn: number;
  leftToScan: number;
  reentries: number;
  totalTickets: number;
  capacityRemaining: number;
  capacityTotal: number;
}

interface PersonEntry {
  ticketId: string;
  name: string;
  email: string;
  checkins: number;
}

interface NotificationEntry {
  id: string;
  message: string;
  createdAt: string;
  createdBy: { name: string; email: string };
}

export const ClientEvent: React.FC = () => {
  const { eventId } = useParams();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [inside, setInside] = useState<PersonEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    const base = API_BASE.replace('http', 'ws');
    return `${base}/ws?eventId=${eventId}`;
  }, [eventId]);

  const loadAll = async () => {
    if (!eventId) return;
    try {
      const [metricsRes, insideRes, noteRes] = await Promise.all([
        apiGet<Metrics>(`/client/events/${eventId}/metrics`),
        apiGet<{ people: PersonEntry[] }>(`/client/events/${eventId}/inside`),
        apiGet<{ notifications: NotificationEntry[] }>(`/client/events/${eventId}/notifications`)
      ]);
      setMetrics(metricsRes);
      setInside(insideRes.people);
      setNotifications(noteRes.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event data.');
    }
  };

  useEffect(() => {
    loadAll();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications((prev) => [data.payload, ...prev].slice(0, 50));
        }
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, [eventId, wsUrl]);

  const handleNotify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eventId || !message.trim()) return;
    setError(null);
    try {
      await apiPost(`/client/events/${eventId}/notify`, { message });
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification.');
    }
  };

  if (!eventId) return null;

  return (
    <ClientLayout title="Event Ops" active="events">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Event Dashboard</p>
            <h2 className="text-2xl font-black uppercase tracking-widest">Event {eventId.slice(-6)}</h2>
          </div>
          <Link to={`/client/scanner/${eventId}`} className="text-xs uppercase tracking-widest text-blue-500">Go to Scanner →</Link>
        </div>

        {metrics && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border border-[#27272a] rounded-2xl p-4 bg-[#111114] text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Scanned In</p>
              <p className="text-2xl font-black text-green-400">{metrics.scannedIn}</p>
            </div>
            <div className="border border-[#27272a] rounded-2xl p-4 bg-[#111114] text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Left To Scan</p>
              <p className="text-2xl font-black text-blue-400">{metrics.leftToScan}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">{metrics.totalTickets} ticketed</p>
            </div>
            <div className="border border-[#27272a] rounded-2xl p-4 bg-[#111114] text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Re-entries</p>
              <p className="text-2xl font-black text-yellow-400">{metrics.reentries}</p>
            </div>
            <div className="border border-[#27272a] rounded-2xl p-4 bg-[#111114] text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Capacity</p>
              <p className="text-2xl font-black text-purple-300">{metrics.capacityRemaining}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">of {metrics.capacityTotal}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114]">
            <h3 className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-4">People Inside</h3>
            {inside.length === 0 ? (
              <p className="text-xs text-zinc-500 uppercase tracking-widest">No check-ins yet.</p>
            ) : (
              <div className="space-y-3">
                {inside.map((person) => (
                  <div key={person.ticketId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{person.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{person.email}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{person.checkins} scans</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-[#27272a] rounded-2xl p-6 bg-[#111114] space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] text-zinc-500">Staff Alerts</h3>
            <form onSubmit={handleNotify} className="space-y-3">
              <textarea
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                placeholder="Notify staff (e.g., tighten ID checks)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <button className="w-full bg-white text-black font-black uppercase tracking-[0.3em] py-3 rounded-xl shadow-xl hover:bg-zinc-200 transition-all">
                Send Alert
              </button>
            </form>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {notifications.map((note) => (
                <div key={note.id} className="border border-[#27272a] rounded-xl p-3">
                  <p className="text-xs text-zinc-200">{note.message}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2">
                    {note.createdBy?.name || 'Staff'} · {new Date(note.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{error}</p>
        )}
      </div>
    </ClientLayout>
  );
};
