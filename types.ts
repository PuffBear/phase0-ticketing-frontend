
export enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  HOST = 'HOST',
  ADMIN = 'ADMIN'
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled'
}

export enum TicketStatus {
  VALID = 'valid',
  VOID = 'void',
  REFUNDED = 'refunded'
}

export enum VenueMode {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  REVEAL_AFTER_TICKET = 'reveal_after_ticket',
  REVEAL_AT_TIME = 'reveal_at_time'
}

export enum ReentryPolicy {
  NO_REENTRY = 'no_reentry',
  UNLIMITED = 'unlimited',
  LIMITED = 'limited'
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  price_minor: number; // In paise (₹1 = 100 paise)
  currency: string;
  capacity: number;
  sold_count: number;
}

export interface Event {
  id: string;
  community_id: string;
  host_user_id: string;
  title: string;
  description: string;
  location: string; 
  start_at: string;
  status: EventStatus;
  visibility: 'invite_only' | 'unlisted' | 'public';
  invite_code: string;
  venue_mode: VenueMode;
  reentry_policy: ReentryPolicy;
  reentry_limit?: number;
  max_tickets_per_user: number;
  tiers: TicketTier[];
}

export interface Ticket {
  id: string;
  event_id: string;
  tier_id: string;
  owner_user_id: string;
  status: TicketStatus;
  checkin_count: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
}
