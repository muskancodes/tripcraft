export type TripStatus = 'upcoming' | 'active' | 'completed' | 'planning';

export interface Traveler {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  countries: string[];
  cities: string[];
  startDate: string;
  endDate: string;
  status: TripStatus;
  travelers: Traveler[];
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  budget: BudgetData;
  flights: Flight[];
  hotels: Hotel[];
  transport: Transport[];
  itinerary: ItineraryDay[];
  places: Place[];
  documents: TravelDocument[];
  gallery: GalleryItem[];
  mapPins: MapPin[];
  tripNotes: Note[];
  packingList: PackingItem[];
  timelineEvents: TimelineEvent[];
  emergencyContacts: EmergencyContact[];
}

export interface BudgetData {
  total: number;
  spent: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  planned: number;
  actual: number;
  color: string;
}

export type BudgetCategoryName =
  | 'Flights'
  | 'Hotels'
  | 'Food'
  | 'Shopping'
  | 'Activities'
  | 'Visa'
  | 'Insurance'
  | 'Local Transport'
  | 'Miscellaneous';

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureCity: string;
  departureDate: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalDate: string;
  arrivalTime: string;
  terminal?: string;
  gate?: string;
  seat?: string;
  bookingRef: string;
  cost: number;
  class: 'economy' | 'business' | 'first';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  checkIn: string;
  checkOut: string;
  cost: number;
  bookingRef?: string;
  bookingLink?: string;
  rating: number;
  roomType?: string;
  amenities: string[];
  notes?: string;
  phone?: string;
  image?: string;
}

export type TransportType = 'train' | 'bus' | 'ferry' | 'taxi' | 'rental' | 'metro' | 'tram' | 'other';

export interface Transport {
  id: string;
  type: TransportType;
  name: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  cost: number;
  duration?: string;
  bookingRef?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface ItineraryDay {
  id: string;
  date: string;
  city: string;
  activities: Activity[];
  notes?: string;
  weather?: string;
}

export type ActivityTime = 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  time: ActivityTime;
  startTime?: string;
  endTime?: string;
  location?: string;
  cost: number;
  category: string;
  notes?: string;
  completed: boolean;
  order: number;
}

export type PlaceCategory =
  | 'attraction'
  | 'restaurant'
  | 'hotel'
  | 'shopping'
  | 'hidden_gem'
  | 'museum'
  | 'park'
  | 'beach'
  | 'nightlife'
  | 'transport'
  | 'other';

export interface Place {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  category: PlaceCategory;
  openingHours?: string;
  cost?: number;
  rating?: number;
  website?: string;
  notes?: string;
  isFavorite: boolean;
  mustVisit: boolean;
  priority: number;
  visited: boolean;
  image?: string;
  lat?: number;
  lng?: number;
}

export type DocumentType =
  | 'passport'
  | 'visa'
  | 'insurance'
  | 'ticket'
  | 'confirmation'
  | 'itinerary'
  | 'other';

export interface TravelDocument {
  id: string;
  type: DocumentType;
  name: string;
  fileData?: string;
  fileName?: string;
  fileSize?: number;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export type GalleryItemType = 'photo' | 'screenshot' | 'instagram' | 'youtube' | 'tiktok' | 'video';

export interface GalleryItem {
  id: string;
  type: GalleryItemType;
  url?: string;
  fileData?: string;
  fileName?: string;
  caption?: string;
  city?: string;
  date?: string;
  tags: string[];
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  category: PlaceCategory;
  color: string;
  placeId?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export interface PackingItem {
  id: string;
  category: string;
  item: string;
  packed: boolean;
  quantity?: number;
  notes?: string;
}

export type TimelineEventType =
  | 'flight'
  | 'hotel'
  | 'activity'
  | 'transport'
  | 'reminder'
  | 'departure'
  | 'arrival';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  date: string;
  time?: string;
  description?: string;
  location?: string;
  refId?: string;
  order: number;
  color: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  country?: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface CountryInfo {
  name: string;
  code: string;
  capital: string;
  currency: string;
  language: string;
  timezone: string;
  emergencyNumber: string;
  voltage: string;
  visaRequired: boolean;
  simInfo: string;
  travelTips: string[];
  flag: string;
}
