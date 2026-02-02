import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiGet, apiPost } from "../../services/api";
import { ClientLayout } from "./ClientLayout";
import { UserRole } from "../../types";

interface EventItem {
  id: string;
  title: string;
  location: string;
  startAt: string;
  capacity: number;
  status: string;
}

interface ClientEventsProps {
  role: UserRole;
}

export const ClientEvents: React.FC<ClientEventsProps> = ({ role }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [staffEntries, setStaffEntries] = useState([
    { email: "", password: "" },
  ]);

  const loadEvents = async () => {
    try {
      const result = await apiGet<{ events: EventItem[] }>("/client/events");
      setEvents(result.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await apiPost("/client/events", {
        title,
        description,
        location,
        startAt,
        capacity: Number(capacity),
        price: Number(price) || 0,
        reentryPolicy: "count_only",
        staff: staffEntries.filter((entry) => entry.email.trim()),
      });
      setTitle("");
      setDescription("");
      setLocation("");
      setStartAt("");
      setCapacity("");
      setPrice("");
      setStaffEntries([{ email: "", password: "" }]);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    }
  };

  const handleDelete = async (eventId: string) => {
    const confirmed = window.confirm(
      "Delete this event? This cannot be undone.",
    );
    if (!confirmed) return;
    setError(null);
    try {
      await apiDelete(`/client/events/${eventId}`);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    }
  };

  const canCreate = role === UserRole.HOST || role === UserRole.ADMIN;

  return (
    <ClientLayout title="Events" active="events">
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase tracking-widest">
            Assigned Events
          </h2>
          {loading ? (
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Loading...
            </p>
          ) : events.length === 0 ? (
            <div className="border border-dashed border-[#27272a] rounded-2xl p-6 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
              No events assigned yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-[#27272a] rounded-2xl p-6 bg-[#111114] flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider">
                      {event.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      {event.location}
                    </p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                      {new Date(event.startAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest">
                      Capacity {event.capacity}
                    </span>
                    <Link
                      to={`/client/events/${event.id}`}
                      className="text-[10px] uppercase tracking-widest text-blue-500 hover:text-blue-300"
                    >
                      Manage →
                    </Link>
                    {canCreate && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {canCreate && (
          <section className="border border-[#27272a] rounded-3xl p-6 bg-[#0f0f12] space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest">
              Create Event
            </h3>
            <form onSubmit={handleCreate} className="grid gap-4">
              <input
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <input
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <input
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
              <input
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                type="number"
                min={1}
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
              <input
                className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm"
                type="number"
                min={0}
                step="0.01"
                placeholder="Price (₹) - Leave 0 for free"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  Assign Staff
                </p>
                {staffEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      className="bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs"
                      placeholder="staff email"
                      value={entry.email}
                      onChange={(e) => {
                        const next = [...staffEntries];
                        next[index].email = e.target.value;
                        setStaffEntries(next);
                      }}
                    />
                    <input
                      className="bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs"
                      placeholder="staff password"
                      value={entry.password}
                      onChange={(e) => {
                        const next = [...staffEntries];
                        next[index].password = e.target.value;
                        setStaffEntries(next);
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setStaffEntries([
                      ...staffEntries,
                      { email: "", password: "" },
                    ])
                  }
                  className="text-xs uppercase tracking-widest text-blue-500"
                >
                  + Add Staff
                </button>
              </div>

              {error && (
                <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                  {error}
                </p>
              )}
              <button className="bg-white text-black font-black uppercase tracking-widest py-3 rounded-xl">
                Create Event
              </button>
            </form>
          </section>
        )}
      </div>
    </ClientLayout>
  );
};
