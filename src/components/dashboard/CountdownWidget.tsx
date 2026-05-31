import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Trip } from '../../types';
import { getDaysUntilTrip, getTripDuration, formatDate } from '../../utils/helpers';
import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

interface Props {
  trip: Trip;
  onClick?: () => void;
}

export default function CountdownWidget({ trip, onClick }: Props) {
  const daysUntil = getDaysUntilTrip(trip.startDate);
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const hoursUntil = differenceInHours(parseISO(trip.startDate), new Date()) % 24;
  const minutesUntil = differenceInMinutes(parseISO(trip.startDate), new Date()) % 60;

  return (
    <motion.div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group h-full min-h-[160px]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {/* Background */}
      {trip.coverImage ? (
        <img src={trip.coverImage} alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs">
              ✈️ Next Trip
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-2">{trip.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-sm text-gray-300">{trip.countries.join(' · ')}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex gap-4">
            <CountBox value={daysUntil} label="Days" />
            <CountBox value={hoursUntil} label="Hours" />
            <CountBox value={minutesUntil} label="Minutes" />
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">{formatDate(trip.startDate, 'MMM d')} – {formatDate(trip.endDate, 'MMM d')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{duration} days · {trip.cities.length} cities</p>
          </div>
        </div>

        <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white leading-none">
        {Math.max(0, value).toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
