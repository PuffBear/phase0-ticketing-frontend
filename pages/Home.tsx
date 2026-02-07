import React, { useMemo, useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { RotatingQRCode } from "../components/QRCode";
import { CURRENT_USER } from "../services/mockData";
import { Ticket, TicketStatus, VenueMode, User } from "../types";
import { Icons } from "../constants";
import { apiGet, apiPost } from "../services/api";

const TicketQr: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const [token, setToken] = useState(ticketId);

  useEffect(() => {
    let timer: number | null = null;
    const fetchToken = async () => {
      try {
        const result = await apiPost<{ token: string }>(
          "/tickets/" + ticketId + "/qr-token",
          {},
        );
        setToken(result.token || ticketId);
      } catch {
        setToken(ticketId);
      }
    };
    fetchToken();
    timer = window.setInterval(fetchToken, 15000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [ticketId]);

  return <RotatingQRCode data={token} />;
};

interface HomeProps {
  user: User;
  onLogout: () => void;
}

interface ExploreEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  capacity: number;
  price: number;
  availableTickets: number;
  status: string;
  ticketsSold: number;
}

const ExploreCard: React.FC<{
  event: ExploreEvent;
  onSelect: (event: ExploreEvent) => void;
}> = ({ event, onSelect }) => {
  const isSoldOut =
    (event.availableTickets ?? event.ticketsSold) <= 0 ||
    event.ticketsSold >= event.capacity;
  const progress = event.capacity
    ? (event.ticketsSold / event.capacity) * 100
    : 0;

  return (
    <div
      onClick={() => onSelect(event)}
      className="group relative bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden hover:border-blue-500 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-black/40"
    >
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">
              Node Sequence
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">
              ID: {event.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.15em] ${
              isSoldOut
                ? "bg-red-500/10 text-red-500"
                : "bg-blue-500/10 text-blue-500"
            }`}
          >
            {isSoldOut ? "Max Capacity" : "Secure Entry Active"}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-2xl leading-tight group-hover:text-blue-400 transition-colors tracking-tighter uppercase italic">
            {event.title}
          </h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
            {event.location}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">
                Timestamp
              </span>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">
                {new Date(event.startAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}{" "}
                @{" "}
                {new Date(event.startAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">
                Tickets
              </span>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">
                {event.ticketsSold} confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2 w-full bg-[#111114] flex items-center px-1 border-t border-[#27272a]">
        <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
          <div
            className={`h-full ${
              isSoldOut ? "bg-red-500" : "bg-blue-600"
            } shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${Math.min(100, progress)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<"explore" | "wallet" | "profile">(
    "explore",
  );
  const [view, setView] = useState<"list" | "detail" | "checkout" | "success">(
    "list",
  );
  const [selectedEvent, setSelectedEvent] = useState<ExploreEvent | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNodes, setActiveNodes] = useState(18);
  const [profilePanel, setProfilePanel] = useState<
    "none" | "ledger" | "privacy"
  >("none");
  const [events, setEvents] = useState<ExploreEvent[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNodes((prev) =>
        Math.max(6, prev + (Math.random() > 0.5 ? 1 : -1)),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await apiGet<{ events: ExploreEvent[] }>("/events");
        setEvents(result.events || []);
      } catch (error) {
        setEventsError(
          error instanceof Error ? error.message : "Failed to load events.",
        );
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const result = await apiGet<{
          tickets: Array<{
            id: string;
            event_id: string;
            status: string;
            checkin_count: number;
            event: { title: string; location: string } | null;
          }>;
        }>("/tickets");
        const mapped = (result.tickets || []).map((t) => ({
          id: t.id,
          event_id: t.event_id,
          tier_id: "default",
          owner_user_id: CURRENT_USER.id,
          status: t.status as TicketStatus,
          checkin_count: t.checkin_count,
          created_at: new Date().toISOString(),
          _event: t.event,
        }));
        setTickets(mapped);
      } catch {
        // User may not be logged in or no tickets
      }
    };
    loadTickets();
  }, []);

  const myTickets = useMemo(
    () => tickets.filter((t) => t.owner_user_id === CURRENT_USER.id),
    [tickets],
  );

  const pollBookingStatus = async (
    bookingId: string,
  ): Promise<{ status: string; ticketId?: string }> => {
    const result = await apiGet<{ status: string; ticketId?: string }>(
      `/bookings/${bookingId}`,
    );
    return result;
  };

  const claimTicket = async () => {
    if (!selectedEvent) return;

    setSelectedTierId("default");
    setIsLoading(true);
    setView("checkout");
    setCheckoutError(null);

    try {
      const { bookingId, razorpayOrderId, razorpayKeyId, amount, currency } =
        await apiPost<{
          bookingId: string;
          razorpayOrderId: string;
          razorpayKeyId: string;
          amount: number;
          currency: string;
        }>("/book", { eventId: selectedEvent.id });

      // 🔥 DEV MODE CHECK: Skip Razorpay if no valid key (dev mode auto-confirm)
      if (
        !razorpayKeyId ||
        razorpayKeyId === "null" ||
        !razorpayOrderId ||
        razorpayOrderId.startsWith("dev_")
      ) {
        // Dev mode: backend auto-confirms, just poll for ticket
        let attempts = 0;
        const maxAttempts = 30;
        while (attempts < maxAttempts) {
          const { status, ticketId } = await pollBookingStatus(bookingId);
          if (status === "CONFIRMED") {
            setTickets((prev) => [
              ...prev,
              {
                id: ticketId || bookingId,
                event_id: selectedEvent.id,
                tier_id: "default",
                owner_user_id: CURRENT_USER.id,
                status: TicketStatus.VALID,
                checkin_count: 0,
                created_at: new Date().toISOString(),
              },
            ]);
            setView("success");
            setIsLoading(false);
            return;
          }
          if (status === "CANCELLED") {
            setView("detail");
            setCheckoutError("Booking was cancelled.");
            setIsLoading(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;
        }
        setView("detail");
        setCheckoutError(
          "Booking is being processed. Check your wallet shortly.",
        );
        setIsLoading(false);
        return;
      }

      // PRODUCTION MODE: Use Razorpay
      const Razorpay = (
        window as unknown as {
          Razorpay: {
            new (o: Record<string, unknown>): {
              open: () => void;
              on: (event: string, handler: () => void) => void;
            };
          };
        }
      ).Razorpay;
      if (!Razorpay) {
        throw new Error("Razorpay not loaded");
      }

      let paymentHandled = false;

      const rzp = new Razorpay({
        key: razorpayKeyId,
        amount,
        currency: currency || "INR",
        order_id: razorpayOrderId,
        name: "phase0",
        description: selectedEvent.title,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          paymentHandled = true;
          try {
            // Verify payment signature on backend
            await apiPost("/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });

            // Poll for confirmation
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
              const { status, ticketId } = await pollBookingStatus(bookingId);
              if (status === "CONFIRMED") {
                setTickets((prev) => [
                  ...prev,
                  {
                    id: ticketId || bookingId,
                    event_id: selectedEvent.id,
                    tier_id: "default",
                    owner_user_id: CURRENT_USER.id,
                    status: TicketStatus.VALID,
                    checkin_count: 0,
                    created_at: new Date().toISOString(),
                  },
                ]);
                setView("success");
                setIsLoading(false);
                return;
              }
              if (status === "CANCELLED") {
                setView("detail");
                setCheckoutError("Payment was cancelled.");
                setIsLoading(false);
                return;
              }
              await new Promise((r) => setTimeout(r, 2000));
              attempts++;
            }
            setView("detail");
            setCheckoutError(
              "Payment is being processed. Check your wallet shortly.",
            );
            setIsLoading(false);
          } catch (error) {
            setView("detail");
            setCheckoutError(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support.",
            );
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: async () => {
            // Only handle dismissal if payment wasn't already processed
            if (paymentHandled) {
              return;
            }

            // User closed the payment modal without completing payment
            try {
              await apiPost("/bookings/" + bookingId + "/cancel", {});
            } catch (error) {
              console.error("Failed to cancel booking:", error);
            }
            setView("detail");
            setCheckoutError("Payment was cancelled.");
            setIsLoading(false);
          },
        },
      });

      rzp.on("payment.failed", async () => {
        paymentHandled = true;

        // Mark booking as failed
        try {
          await apiPost("/bookings/" + bookingId + "/fail", {});
        } catch (error) {
          console.error("Failed to mark booking as failed:", error);
        }

        setView("detail");
        setCheckoutError("Payment failed. Please try again.");
        setIsLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Failed to secure ticket:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setCheckoutError(errorMessage);
      setView("detail");
      setIsLoading(false);
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(t) => {
        setActiveTab(t);
        setView("list");
      }}
      isLoggedIn={true}
    >
      <div className="max-w-md mx-auto p-4 space-y-8">
        {activeTab === "explore" && (
          <>
            {view === "list" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                      Discovery
                    </h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      Available entry points
                    </p>
                  </div>

                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                        System Live
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase leading-none">
                          Online
                        </span>
                        <span className="text-[10px] text-zinc-300 font-bold">
                          {activeNodes}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase leading-none">
                          Traffic
                        </span>
                        <span className="text-[10px] text-zinc-300 font-bold">
                          Stable
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                <div className="grid gap-4">
                  {events.map((event) => (
                    <ExploreCard
                      key={event.id}
                      event={event}
                      onSelect={(e) => {
                        setSelectedEvent(e);
                        setView("detail");
                      }}
                    />
                  ))}
                  {events.length === 0 && (
                    <div className="border border-dashed border-[#27272a] rounded-2xl p-6 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                      No events live yet.
                    </div>
                  )}
                  {eventsError && (
                    <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                      {eventsError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {view === "detail" && selectedEvent && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => {
                    setView("list");
                    setCheckoutError(null);
                  }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors tracking-[0.2em]"
                >
                  <span className="text-lg">←</span> Return to Discovery
                </button>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                      {selectedEvent.title}
                    </h1>
                    <div className="flex gap-2">
                      <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded-md border border-blue-500/20 uppercase tracking-widest">
                        Live Event
                      </span>
                      <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                        Capacity: {selectedEvent.capacity}
                      </span>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {selectedEvent.description}
                  </p>

                  <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                      Ticketing
                    </h4>
                    <div className="space-y-3">
                      <div className="w-full bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-zinc-200">
                            General Admission
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {selectedEvent.availableTickets ??
                              selectedEvent.capacity -
                                selectedEvent.ticketsSold}{" "}
                            available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">
                            ₹{selectedEvent.price ?? 0}
                          </p>
                          {(() => {
                            const hasTicket = myTickets.some(
                              (t) => t.event_id === selectedEvent.id,
                            );
                            const isSoldOut =
                              (selectedEvent.availableTickets ?? 1) <= 0;

                            if (hasTicket) {
                              return (
                                <div className="mt-2 w-full bg-green-500/10 text-green-500 font-black uppercase tracking-[0.2em] py-2.5 px-4 rounded-xl text-xs border border-green-500/20 text-center">
                                  Already Booked
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={claimTicket}
                                disabled={isLoading || isSoldOut}
                                className="mt-2 w-full bg-white text-black font-black uppercase tracking-[0.2em] py-2.5 px-4 rounded-xl text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoading ? "Processing..." : "Buy Ticket"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                      {checkoutError && (
                        <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                          {checkoutError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === "checkout" && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black uppercase">
                    Securing Access
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
                    Minting_Secure_Token...
                  </p>
                </div>
              </div>
            )}

            {view === "success" && (
              <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-500 text-center">
                <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">
                    Access Secured
                  </h2>
                  <p className="text-sm text-zinc-500 font-medium px-8">
                    Your event infrastructure access is now active in your
                    wallet.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setView("list");
                    setActiveTab("wallet");
                  }}
                  className="w-full max-w-xs py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  View Wallet
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <header className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase">
                Wallet
              </h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Active credentials
              </p>
            </header>

            {myTickets.length > 0 ? (
              <div className="space-y-6">
                {myTickets.map((ticket) => {
                  const ticketWithEvent = ticket as Ticket & {
                    _event?: { title: string; location: string };
                  };
                  const event = ticketWithEvent._event
                    ? {
                        title: ticketWithEvent._event.title,
                        location: ticketWithEvent._event.location,
                        venue_mode: undefined,
                      }
                    : (events.find((e) => e.id === ticket.event_id) ?? {
                        title: "Event",
                        location: "",
                        venue_mode: undefined,
                      });
                  return (
                    <div
                      key={ticket.id}
                      className="relative bg-[#18181b] border border-[#27272a] rounded-[2rem] p-8 space-y-8 shadow-2xl overflow-hidden group"
                    >
                      <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">
                          SECURE ACCESS TOKEN
                        </p>
                        <h3 className="text-2xl font-black uppercase tracking-tight">
                          {event?.title}
                        </h3>
                        <div className="flex justify-center gap-3">
                          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter font-bold">
                            SEQ_{ticket.id.slice(-6)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter font-bold">
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center py-2">
                        <TicketQr ticketId={ticket.id} />
                      </div>

                      <div className="pt-8 border-t border-[#27272a] border-dashed space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                              Location Reveal
                            </p>
                            <p className="text-xs font-bold text-zinc-200">
                              {event?.venue_mode ===
                              VenueMode.REVEAL_AFTER_TICKET
                                ? event.location
                                : "Hidden - Resolve at Door"}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                              Lifecycle
                            </p>
                            <p
                              className={`text-xs font-black uppercase ${
                                ticket.checkin_count > 0
                                  ? "text-zinc-500"
                                  : "text-green-500"
                              }`}
                            >
                              {ticket.checkin_count > 0 ? "EXPIRED" : "ACTIVE"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 text-center space-y-6 opacity-30">
                <div className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-full mx-auto flex items-center justify-center">
                  <Icons.Ticket />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                    Credentials Empty
                  </p>
                  <button
                    onClick={() => setActiveTab("explore")}
                    className="text-xs font-bold text-blue-500 underline uppercase tracking-widest"
                  >
                    Acquire access
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <header className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase">
                Profile
              </h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Identity + access
              </p>
            </header>

            <div className="bg-gradient-to-br from-[#18181b] via-[#121214] to-[#0f0f10] border border-[#27272a] rounded-[2.25rem] p-6 space-y-6 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-[#2f2f35] flex items-center justify-center font-black text-2xl text-white">
                  {(user.name || CURRENT_USER.name).charAt(0)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold uppercase tracking-tight">
                    {user.name || CURRENT_USER.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                      Verified
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Member
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    Identity Layer
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Email</span>
                      <span>{user.email || "Not linked"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Username</span>
                      <span>{user.username || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-3 text-center">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                      Tickets
                    </p>
                    <p className="text-lg font-black text-white">
                      {myTickets.length}
                    </p>
                  </div>
                  <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-3 text-center">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                      Events
                    </p>
                    <p className="text-lg font-black text-white">
                      {new Set(myTickets.map((t) => t.event_id)).size}
                    </p>
                  </div>
                  <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-3 text-center">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                      Trust
                    </p>
                    <p className="text-lg font-black text-blue-400">A+</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => setProfilePanel("ledger")}
                className="w-full text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex justify-between items-center group hover:border-zinc-600 transition-all"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  Activity ledger
                </span>
                <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  →
                </span>
              </button>
              <button
                onClick={() => setProfilePanel("privacy")}
                className="w-full text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex justify-between items-center group hover:border-zinc-600 transition-all"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  Privacy controls
                </span>
                <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  →
                </span>
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex justify-between items-center group hover:bg-red-500/10 transition-all mt-4"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                  Terminate Session
                </span>
                <span className="text-red-500/50 group-hover:text-red-500 transition-colors">
                  EXIT
                </span>
              </button>
            </div>

            <div className="p-6 text-center space-y-2 border border-dashed border-[#27272a] rounded-3xl opacity-60">
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                Core Version
              </p>
              <p className="text-[10px] font-mono text-zinc-700">
                PHASE0_BUILD_V2024.05.24
              </p>
            </div>
            {profilePanel !== "none" && (
              <div className="border border-[#27272a] rounded-3xl p-6 bg-[#111114] space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {profilePanel === "ledger"
                      ? "Activity Ledger"
                      : "Privacy Controls"}
                  </p>
                  <button
                    onClick={() => setProfilePanel("none")}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="text-xs text-zinc-500 font-medium leading-relaxed">
                  {profilePanel === "ledger"
                    ? "Your activity trail will appear here once live tracking is enabled."
                    : "Control visibility, data sharing, and personalization preferences here."}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading && selectedTierId && (
          <div className="hidden" data-tier={selectedTierId}></div>
        )}
      </div>
    </Layout>
  );
};
