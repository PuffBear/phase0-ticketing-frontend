import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

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

// Placeholder events for when backend has no events
const PLACEHOLDER_EVENTS: ExploreEvent[] = [
    {
        id: 'placeholder-1',
        title: 'Tech Meetup 2026',
        description: 'Join us for an evening of networking and tech talks',
        location: 'Innovation Hub, Bangalore',
        startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        capacity: 100,
        price: 299,
        availableTickets: 45,
        status: 'published',
        ticketsSold: 55,
    },
    {
        id: 'placeholder-2',
        title: 'Music Night Live',
        description: 'An unforgettable night of indie music and good vibes',
        location: 'The Blue Room, Mumbai',
        startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        capacity: 200,
        price: 499,
        availableTickets: 120,
        status: 'published',
        ticketsSold: 80,
    },
    {
        id: 'placeholder-3',
        title: 'Startup Pitch Night',
        description: 'Watch founders pitch their ideas to investors',
        location: 'Co-Work Space, Hyderabad',
        startAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        capacity: 75,
        price: 0,
        availableTickets: 30,
        status: 'published',
        ticketsSold: 45,
    },
    {
        id: 'placeholder-4',
        title: 'Art Exhibition Opening',
        description: 'Contemporary art showcase featuring local artists',
        location: 'Gallery 27, Delhi',
        startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        capacity: 150,
        price: 199,
        availableTickets: 90,
        status: 'published',
        ticketsSold: 60,
    },
    {
        id: 'placeholder-5',
        title: 'Food Festival 2026',
        description: 'Taste cuisines from around the world',
        location: 'Central Park, Pune',
        startAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        capacity: 500,
        price: 599,
        availableTickets: 250,
        status: 'published',
        ticketsSold: 250,
    },
];

export const CorridorExplorer: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<ExploreEvent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch events
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const result = await apiGet<{ events: ExploreEvent[] }>('/events');
                const fetchedEvents = result.events && result.events.length > 0 ? result.events : PLACEHOLDER_EVENTS;

                // If only one event, add a "coming soon" placeholder
                if (fetchedEvents.length === 1) {
                    setEvents([
                        ...fetchedEvents,
                        {
                            id: 'coming-soon',
                            title: 'More Events Coming Soon',
                            description: 'Stay tuned for exciting upcoming events',
                            location: 'To Be Announced',
                            startAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                            capacity: 0,
                            price: 0,
                            availableTickets: 0,
                            status: 'draft',
                            ticketsSold: 0,
                        }
                    ]);
                } else {
                    setEvents(fetchedEvents);
                }
            } catch (error) {
                console.error('Failed to load events:', error);
                // Use placeholder events on error
                setEvents(PLACEHOLDER_EVENTS);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    // Handle navigation
    const navigateToEvent = (direction: 'left' | 'right') => {
        if (isTransitioning || events.length === 0) return;

        setIsTransitioning(true);
        if (direction === 'right' && currentIndex < events.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (direction === 'left' && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }

        setTimeout(() => setIsTransitioning(false), 400);
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') navigateToEvent('left');
            if (e.key === 'ArrowRight') navigateToEvent('right');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, events.length, isTransitioning]);

    // Touch controls
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) > 50) {
            if (diff > 0) navigateToEvent('right');
            else navigateToEvent('left');
        }
    };

    const handleDoorClick = (event: ExploreEvent) => {
        // Don't allow clicking on "coming soon" placeholder
        if (event.id === 'coming-soon') return;
        navigate('/auth', { state: { preselectedEvent: event } });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center">
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                    Loading corridor...
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center p-6 space-y-6">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    No events available
                </p>
                <button
                    onClick={() => navigate('/auth')}
                    className="bg-white text-black py-3 px-6 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all"
                >
                    Continue to Login
                </button>
            </div>
        );
    }

    const renderDoors = () => {
        return events.map((event, index) => {
            const offset = index - currentIndex;
            const isCenter = offset === 0;
            const isAdjacent = Math.abs(offset) === 1;
            const isVisible = Math.abs(offset) <= 1;
            const isComingSoon = event.id === 'coming-soon';

            if (!isVisible) return null;

            const translateX = offset * 400;
            const translateZ = isCenter ? 0 : -300;
            const scale = isCenter ? 1 : 0.7;
            const opacity = isCenter ? 1 : 0.5;
            const rotateY = offset * -15;

            return (
                <div
                    key={event.id}
                    onClick={() => isCenter && handleDoorClick(event)}
                    className={`absolute transition-all duration-500 ease-out ${isCenter ? 'z-20' : 'z-10'} ${isComingSoon && isCenter ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    style={{
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`,
                        opacity,
                        left: '50%',
                        top: '50%',
                        marginLeft: '-200px',
                        marginTop: '-250px',
                        width: '400px',
                        height: '500px',
                        pointerEvents: isCenter ? 'auto' : 'none',
                    }}
                >
                    {/* Door Frame */}
                    <div className={`relative w-full h-full bg-gradient-to-b from-[#18181b] to-[#111114] border-4 rounded-3xl overflow-hidden shadow-2xl ${isComingSoon ? 'border-[#1f1f23]' : 'border-[#27272a]'
                        }`}>
                        {/* Glowing Edge Effect */}
                        <div className={`absolute inset-0 border-2 rounded-3xl transition-all duration-500 ${isCenter && !isComingSoon
                            ? 'border-blue-500/50 shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)]'
                            : isCenter && isComingSoon
                                ? 'border-zinc-700/50 shadow-[0_0_20px_-10px_rgba(113,113,122,0.3)]'
                                : 'border-transparent'
                            }`} />

                        {/* Door Content */}
                        <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-6">
                            {/* Event Title */}
                            <div className="text-center space-y-2">
                                <h3 className={`text-2xl font-black uppercase tracking-tight leading-tight ${isComingSoon ? 'text-zinc-600' : ''
                                    }`}>
                                    {event.title}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                    {event.location}
                                </p>
                            </div>

                            {/* Event Date - hide for coming soon */}
                            {!isComingSoon && (
                                <div className="bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-center">
                                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">
                                        Timestamp
                                    </p>
                                    <p className="text-xs font-bold text-zinc-300">
                                        {new Date(event.startAt).toLocaleDateString([], {
                                            month: 'short',
                                            day: 'numeric',
                                        })}{' '}
                                        @{' '}
                                        {new Date(event.startAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Coming Soon Badge */}
                            {isComingSoon && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-center">
                                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                                        Stay Tuned
                                    </p>
                                </div>
                            )}

                            {/* Capacity Bar - hide for coming soon */}
                            {!isComingSoon && (
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                                        <span>Capacity</span>
                                        <span>{event.ticketsSold} / {event.capacity}</span>
                                    </div>
                                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 rounded-full"
                                            style={{ width: `${Math.min(100, (event.ticketsSold / event.capacity) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Enter Prompt (only for center door) */}
                            {isCenter && !isComingSoon && (
                                <div className="absolute bottom-8 left-0 right-0 text-center animate-pulse">
                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">
                                        Click to Enter →
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Door Handle */}
                        <div className={`absolute right-8 top-1/2 -translate-y-1/2 w-3 h-16 rounded-full ${isComingSoon ? 'bg-zinc-800' : 'bg-zinc-700'
                            }`} />
                    </div>
                </div>
            );
        });
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 bg-[#09090b] overflow-hidden select-none"
        >
            {/* Corridor Scene */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center center',
                }}
            >
                {/* Floor Grid (perspective effect) */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#111114] to-transparent opacity-40" />

                {/* Doors */}
                <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                    {renderDoors()}
                </div>
            </div>

            {/* UI Overlay */}
            <div className="absolute top-6 left-0 right-0 z-40 flex justify-center">
                <div className="bg-[#18181b]/80 backdrop-blur-md border border-[#27272a] rounded-2xl px-6 py-3 space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
                        {currentIndex + 1} / {events.length}
                    </p>
                    <p className="text-xs font-bold text-zinc-300 text-center">
                        Navigate with arrows or swipe
                    </p>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={() => navigateToEvent('left')}
                disabled={currentIndex === 0 || isTransitioning}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-[#18181b]/80 backdrop-blur-md border border-[#27272a] rounded-full flex items-center justify-center hover:bg-[#27272a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <span className="text-xl text-blue-500">←</span>
            </button>

            <button
                onClick={() => navigateToEvent('right')}
                disabled={currentIndex === events.length - 1 || isTransitioning}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-[#18181b]/80 backdrop-blur-md border border-[#27272a] rounded-full flex items-center justify-center hover:bg-[#27272a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <span className="text-xl text-blue-500">→</span>
            </button>

            {/* Footer Prompt */}
            <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center">
                <button
                    onClick={() => navigate('/auth')}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
                >
                    Go to Login/Signup
                </button>
            </div>
        </div>
    );
};
