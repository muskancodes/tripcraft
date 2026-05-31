import { Trip } from '../../types';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, DollarSign, Plane, Hotel, Activity, AlertCircle, Info } from 'lucide-react';
import { formatDate, getTripDuration, formatCurrency, getBudgetPercentage } from '../../utils/helpers';
import { COUNTRY_INFO } from '../../data/sampleData';
import CurrencyConverter from '../features/CurrencyConverter';
import PackingChecklist from '../features/PackingChecklist';

interface Props { trip: Trip }

export default function OverviewTab({ trip }: Props) {
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const spentPct = getBudgetPercentage(trip.budget.spent, trip.budget.total);
  const countryInfoList = trip.countries.map(c => COUNTRY_INFO.find(ci => ci.name === c)).filter(Boolean);

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStat icon={<Calendar className="w-4 h-4 text-indigo-400" />} label="Duration" value={`${duration} days`} />
          <QuickStat icon={<MapPin className="w-4 h-4 text-pink-400" />} label="Cities" value={trip.cities.join(', ') || '—'} small />
          <QuickStat icon={<Users className="w-4 h-4 text-green-400" />} label="Travelers" value={trip.travelers.map(t => t.name).join(', ') || '—'} small />
          <QuickStat icon={<DollarSign className="w-4 h-4 text-yellow-400" />} label="Budget" value={formatCurrency(trip.budget.total, trip.currency)} />
        </div>

        {/* Description */}
        {trip.description && (
          <div className="glass-card p-4">
            <p className="text-gray-300 text-sm leading-relaxed">{trip.description}</p>
          </div>
        )}

        {/* Budget overview */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" /> Budget Overview
          </h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Progress</span>
            <span className="text-sm font-medium text-white">
              {formatCurrency(trip.budget.spent, trip.currency)} / {formatCurrency(trip.budget.total, trip.currency)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-5">
            <motion.div
              className={`h-full rounded-full ${spentPct > 90 ? 'bg-red-500' : spentPct > 70 ? 'bg-yellow-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {trip.budget.categories.slice(0, 6).map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <span className="text-base">{cat.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate">{cat.name}</p>
                  <p className="text-xs font-medium text-white">{formatCurrency(cat.planned, trip.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flights & Hotels summary */}
        <div className="grid sm:grid-cols-2 gap-4">
          <SummaryCard
            icon={<Plane className="w-4 h-4 text-blue-400" />}
            title="Flights"
            count={trip.flights.length}
            items={trip.flights.slice(0, 3).map(f => `${f.airline} ${f.flightNumber} · ${f.departureCity} → ${f.arrivalCity}`)}
          />
          <SummaryCard
            icon={<Hotel className="w-4 h-4 text-purple-400" />}
            title="Hotels"
            count={trip.hotels.length}
            items={trip.hotels.slice(0, 3).map(h => `${h.name} · ${h.city}`)}
          />
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" /> Trip Notes
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">{trip.notes}</p>
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Currency converter */}
        <CurrencyConverter baseCurrency={trip.currency} />

        {/* Country info */}
        {countryInfoList.map(info => info && (
          <div key={info.code} className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{info.flag}</span>
              <div>
                <h3 className="text-sm font-semibold text-white">{info.name}</h3>
                <p className="text-xs text-gray-500">{info.capital}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoRow label="Currency" value={info.currency} />
              <InfoRow label="Language" value={info.language} />
              <InfoRow label="Timezone" value={info.timezone} />
              <InfoRow label="Voltage" value={info.voltage} />
              <InfoRow label="Emergency" value={info.emergencyNumber} />
              <InfoRow label="Visa" value={info.visaRequired ? '⚠️ Required' : '✅ Free'} />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">SIM Card Info</p>
              <p className="text-xs text-gray-500 leading-relaxed">{info.simInfo}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Travel Tips</p>
              <ul className="space-y-1">
                {info.travelTips.slice(0, 3).map((tip, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Packing checklist preview */}
        {trip.packingList.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">🎒 Packing Progress</h3>
            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
              <span>{trip.packingList.filter(p => p.packed).length} / {trip.packingList.length} packed</span>
              <span>{Math.round((trip.packingList.filter(p => p.packed).length / trip.packingList.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(trip.packingList.filter(p => p.packed).length / trip.packingList.length) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        )}

        {/* Emergency contacts */}
        {trip.emergencyContacts.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" /> Emergency Contacts
            </h3>
            <div className="space-y-2">
              {trip.emergencyContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-white">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.relationship}</p>
                  </div>
                  <a href={`tel:${contact.phone}`} className="text-xs text-indigo-400 font-mono hover:text-indigo-300">
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className={`font-semibold text-white ${small ? 'text-xs' : 'text-sm'} truncate`}>{value}</p>
    </div>
  );
}

function SummaryCard({ icon, title, count, items }: { icon: React.ReactNode; title: string; count: number; items: string[] }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-gray-400 truncate">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-600">None added yet</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-600">{label}: </span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
