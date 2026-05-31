import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trip, Flight, Hotel, Transport, ItineraryDay, Activity, Place, TravelDocument, GalleryItem, MapPin, Note, PackingItem, TimelineEvent, EmergencyContact } from '../types';
import { defaultPackingList } from '../data/sampleData';
import { scheduleSave } from '../services/syncService';
import { v4 as uuidv4 } from 'uuid';

interface TripStore {
  trips: Trip[];
  activeTrip: Trip | null;

  // Trip CRUD
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Trip;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  duplicateTrip: (id: string) => Trip;
  setActiveTrip: (trip: Trip | null) => void;
  getTrip: (id: string) => Trip | undefined;

  // Flights
  addFlight: (tripId: string, flight: Omit<Flight, 'id'>) => void;
  updateFlight: (tripId: string, flightId: string, updates: Partial<Flight>) => void;
  deleteFlight: (tripId: string, flightId: string) => void;

  // Hotels
  addHotel: (tripId: string, hotel: Omit<Hotel, 'id'>) => void;
  updateHotel: (tripId: string, hotelId: string, updates: Partial<Hotel>) => void;
  deleteHotel: (tripId: string, hotelId: string) => void;

  // Transport
  addTransport: (tripId: string, transport: Omit<Transport, 'id'>) => void;
  updateTransport: (tripId: string, transportId: string, updates: Partial<Transport>) => void;
  deleteTransport: (tripId: string, transportId: string) => void;

  // Itinerary
  addItineraryDay: (tripId: string, day: Omit<ItineraryDay, 'id'>) => void;
  updateItineraryDay: (tripId: string, dayId: string, updates: Partial<ItineraryDay>) => void;
  deleteItineraryDay: (tripId: string, dayId: string) => void;
  addActivity: (tripId: string, dayId: string, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (tripId: string, dayId: string, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (tripId: string, dayId: string, activityId: string) => void;
  reorderActivities: (tripId: string, dayId: string, activities: Activity[]) => void;

  // Places
  addPlace: (tripId: string, place: Omit<Place, 'id'>) => void;
  updatePlace: (tripId: string, placeId: string, updates: Partial<Place>) => void;
  deletePlace: (tripId: string, placeId: string) => void;
  toggleFavoritePlace: (tripId: string, placeId: string) => void;
  toggleVisitedPlace: (tripId: string, placeId: string) => void;

  // Documents
  addDocument: (tripId: string, doc: Omit<TravelDocument, 'id' | 'createdAt'>) => void;
  deleteDocument: (tripId: string, docId: string) => void;

  // Gallery
  addGalleryItem: (tripId: string, item: Omit<GalleryItem, 'id'>) => void;
  deleteGalleryItem: (tripId: string, itemId: string) => void;

  // Map Pins
  addMapPin: (tripId: string, pin: Omit<MapPin, 'id'>) => void;
  updateMapPin: (tripId: string, pinId: string, updates: Partial<MapPin>) => void;
  deleteMapPin: (tripId: string, pinId: string) => void;

  // Notes
  addNote: (tripId: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (tripId: string, noteId: string, updates: Partial<Note>) => void;
  deleteNote: (tripId: string, noteId: string) => void;

  // Packing
  addPackingItem: (tripId: string, item: Omit<PackingItem, 'id'>) => void;
  updatePackingItem: (tripId: string, itemId: string, updates: Partial<PackingItem>) => void;
  deletePackingItem: (tripId: string, itemId: string) => void;
  togglePackingItem: (tripId: string, itemId: string) => void;
  importDefaultPacking: (tripId: string) => void;

  // Timeline
  addTimelineEvent: (tripId: string, event: Omit<TimelineEvent, 'id'>) => void;
  updateTimelineEvent: (tripId: string, eventId: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (tripId: string, eventId: string) => void;

  // Emergency Contacts
  addEmergencyContact: (tripId: string, contact: Omit<EmergencyContact, 'id'>) => void;
  updateEmergencyContact: (tripId: string, contactId: string, updates: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (tripId: string, contactId: string) => void;

  // Budget
  updateBudgetCategory: (tripId: string, categoryId: string, updates: { planned?: number; actual?: number }) => void;
  updateBudgetTotal: (tripId: string, total: number) => void;
}

const updateTripHelper = (trips: Trip[], tripId: string, updater: (trip: Trip) => Trip): Trip[] => {
  return trips.map(t => t.id === tripId ? { ...updater(t), updatedAt: new Date().toISOString() } : t);
};

// sync() is intentionally unused per-action — the subscribe below handles all saves
const sync = (_get: () => TripStore) => {};

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      activeTrip: null,

      addTrip: (tripData) => {
        const trip: Trip = {
          ...tripData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ trips: [trip, ...state.trips] }));
        sync(get);
        return trip;
      },

      updateTrip: (id, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, id, t => ({ ...t, ...updates })),
          activeTrip: state.activeTrip?.id === id ? { ...state.activeTrip, ...updates, updatedAt: new Date().toISOString() } : state.activeTrip,
        }));
        sync(get);
      },

      deleteTrip: (id) => {
        set(state => ({
          trips: state.trips.filter(t => t.id !== id),
          activeTrip: state.activeTrip?.id === id ? null : state.activeTrip,
        }));
        sync(get);
      },

      duplicateTrip: (id) => {
        const trip = get().trips.find(t => t.id === id);
        if (!trip) throw new Error('Trip not found');
        const newTrip: Trip = {
          ...trip,
          id: uuidv4(),
          name: `${trip.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'planning',
        };
        set(state => ({ trips: [newTrip, ...state.trips] }));
        sync(get);
        return newTrip;
      },

      setActiveTrip: (trip) => set({ activeTrip: trip }),

      getTrip: (id) => get().trips.find(t => t.id === id),

      addFlight: (tripId, flight) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, flights: [...t.flights, { ...flight, id: uuidv4() }]
          }))
        }));
      },

      updateFlight: (tripId, flightId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, flights: t.flights.map(f => f.id === flightId ? { ...f, ...updates } : f)
          }))
        }));
      },

      deleteFlight: (tripId, flightId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, flights: t.flights.filter(f => f.id !== flightId)
          }))
        }));
      },

      addHotel: (tripId, hotel) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, hotels: [...t.hotels, { ...hotel, id: uuidv4() }]
          }))
        }));
      },

      updateHotel: (tripId, hotelId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, hotels: t.hotels.map(h => h.id === hotelId ? { ...h, ...updates } : h)
          }))
        }));
      },

      deleteHotel: (tripId, hotelId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, hotels: t.hotels.filter(h => h.id !== hotelId)
          }))
        }));
      },

      addTransport: (tripId, transport) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, transport: [...t.transport, { ...transport, id: uuidv4() }]
          }))
        }));
      },

      updateTransport: (tripId, transportId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, transport: t.transport.map(tr => tr.id === transportId ? { ...tr, ...updates } : tr)
          }))
        }));
      },

      deleteTransport: (tripId, transportId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, transport: t.transport.filter(tr => tr.id !== transportId)
          }))
        }));
      },

      addItineraryDay: (tripId, day) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: [...t.itinerary, { ...day, id: uuidv4() }].sort((a, b) => a.date.localeCompare(b.date))
          }))
        }));
      },

      updateItineraryDay: (tripId, dayId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.map(d => d.id === dayId ? { ...d, ...updates } : d)
          }))
        }));
      },

      deleteItineraryDay: (tripId, dayId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.filter(d => d.id !== dayId)
          }))
        }));
      },

      addActivity: (tripId, dayId, activity) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.map(d =>
              d.id === dayId ? { ...d, activities: [...d.activities, { ...activity, id: uuidv4() }] } : d
            )
          }))
        }));
      },

      updateActivity: (tripId, dayId, activityId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.map(d =>
              d.id === dayId ? {
                ...d, activities: d.activities.map(a => a.id === activityId ? { ...a, ...updates } : a)
              } : d
            )
          }))
        }));
      },

      deleteActivity: (tripId, dayId, activityId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.map(d =>
              d.id === dayId ? { ...d, activities: d.activities.filter(a => a.id !== activityId) } : d
            )
          }))
        }));
      },

      reorderActivities: (tripId, dayId, activities) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, itinerary: t.itinerary.map(d => d.id === dayId ? { ...d, activities } : d)
          }))
        }));
      },

      addPlace: (tripId, place) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, places: [...t.places, { ...place, id: uuidv4() }]
          }))
        }));
      },

      updatePlace: (tripId, placeId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, places: t.places.map(p => p.id === placeId ? { ...p, ...updates } : p)
          }))
        }));
      },

      deletePlace: (tripId, placeId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, places: t.places.filter(p => p.id !== placeId)
          }))
        }));
      },

      toggleFavoritePlace: (tripId, placeId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, places: t.places.map(p => p.id === placeId ? { ...p, isFavorite: !p.isFavorite } : p)
          }))
        }));
      },

      toggleVisitedPlace: (tripId, placeId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, places: t.places.map(p => p.id === placeId ? { ...p, visited: !p.visited } : p)
          }))
        }));
      },

      addDocument: (tripId, doc) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, documents: [...t.documents, { ...doc, id: uuidv4(), createdAt: new Date().toISOString() }]
          }))
        }));
      },

      deleteDocument: (tripId, docId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, documents: t.documents.filter(d => d.id !== docId)
          }))
        }));
      },

      addGalleryItem: (tripId, item) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, gallery: [...t.gallery, { ...item, id: uuidv4() }]
          }))
        }));
      },

      deleteGalleryItem: (tripId, itemId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, gallery: t.gallery.filter(g => g.id !== itemId)
          }))
        }));
      },

      addMapPin: (tripId, pin) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, mapPins: [...t.mapPins, { ...pin, id: uuidv4() }]
          }))
        }));
      },

      updateMapPin: (tripId, pinId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, mapPins: t.mapPins.map(p => p.id === pinId ? { ...p, ...updates } : p)
          }))
        }));
      },

      deleteMapPin: (tripId, pinId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, mapPins: t.mapPins.filter(p => p.id !== pinId)
          }))
        }));
      },

      addNote: (tripId, note) => {
        const now = new Date().toISOString();
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, tripNotes: [...t.tripNotes, { ...note, id: uuidv4(), createdAt: now, updatedAt: now }]
          }))
        }));
      },

      updateNote: (tripId, noteId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, tripNotes: t.tripNotes.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
          }))
        }));
      },

      deleteNote: (tripId, noteId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, tripNotes: t.tripNotes.filter(n => n.id !== noteId)
          }))
        }));
      },

      addPackingItem: (tripId, item) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, packingList: [...t.packingList, { ...item, id: uuidv4() }]
          }))
        }));
      },

      updatePackingItem: (tripId, itemId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, packingList: t.packingList.map(p => p.id === itemId ? { ...p, ...updates } : p)
          }))
        }));
      },

      deletePackingItem: (tripId, itemId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, packingList: t.packingList.filter(p => p.id !== itemId)
          }))
        }));
      },

      togglePackingItem: (tripId, itemId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, packingList: t.packingList.map(p => p.id === itemId ? { ...p, packed: !p.packed } : p)
          }))
        }));
      },

      importDefaultPacking: (tripId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, packingList: defaultPackingList.map((item) => ({ ...item, id: uuidv4() }))
          }))
        }));
      },

      addTimelineEvent: (tripId, event) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, timelineEvents: [...t.timelineEvents, { ...event, id: uuidv4() }].sort((a, b) => a.date.localeCompare(b.date))
          }))
        }));
      },

      updateTimelineEvent: (tripId, eventId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, timelineEvents: t.timelineEvents.map(e => e.id === eventId ? { ...e, ...updates } : e)
          }))
        }));
      },

      deleteTimelineEvent: (tripId, eventId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, timelineEvents: t.timelineEvents.filter(e => e.id !== eventId)
          }))
        }));
      },

      addEmergencyContact: (tripId, contact) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, emergencyContacts: [...t.emergencyContacts, { ...contact, id: uuidv4() }]
          }))
        }));
      },

      updateEmergencyContact: (tripId, contactId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, emergencyContacts: t.emergencyContacts.map(c => c.id === contactId ? { ...c, ...updates } : c)
          }))
        }));
      },

      deleteEmergencyContact: (tripId, contactId) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, emergencyContacts: t.emergencyContacts.filter(c => c.id !== contactId)
          }))
        }));
      },

      updateBudgetCategory: (tripId, categoryId, updates) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, budget: {
              ...t.budget,
              categories: t.budget.categories.map(c =>
                c.id === categoryId ? { ...c, ...updates } : c
              ),
              spent: t.budget.categories.reduce((sum, c) =>
                sum + (c.id === categoryId ? (updates.actual ?? c.actual) : c.actual), 0
              )
            }
          }))
        }));
      },

      updateBudgetTotal: (tripId, total) => {
        set(state => ({
          trips: updateTripHelper(state.trips, tripId, t => ({
            ...t, budget: { ...t.budget, total }
          }))
        }));
      },
    }),
    { name: 'tripcraft-trips' }
  )
);

// Auto-save to server whenever trips change (catches every mutation)
useTripStore.subscribe((state) => scheduleSave(state.trips));
