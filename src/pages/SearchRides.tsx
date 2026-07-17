import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Calendar, Users, Star, Car, ArrowRight, CornerDownRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SearchRidesProps {
  onNavigate: (page: string, extraData?: any) => void;
}

export const SearchRides: React.FC<SearchRidesProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Auto-fetch featured/all scheduled rides on load
  useEffect(() => {
    fetchActiveRides();
    const saved = localStorage.getItem('rideLinkRecentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchActiveRides = async (
    e?: React.FormEvent,
    customPickup?: string,
    customDestination?: string,
    customDate?: string
  ) => {
    if (e) e.preventDefault();
    setLoading(true);

    const activePickup = customPickup !== undefined ? customPickup : pickup;
    const activeDestination = customDestination !== undefined ? customDestination : destination;
    const activeDate = customDate !== undefined ? customDate : date;

    try {
      const query = new URLSearchParams();
      if (activePickup) query.append('pickup', activePickup);
      if (activeDestination) query.append('destination', activeDestination);
      if (activeDate) query.append('date', activeDate);

      const res = await fetch(`/api/rides?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRides(data.data);
      }
      setSearched(true);

      // Save to recent searches if the user explicitly typed values and searched
      if ((activePickup || activeDestination) && customPickup === undefined) {
        const newSearch = {
          pickup: activePickup,
          destination: activeDestination,
          date: activeDate,
          timestamp: Date.now()
        };
        const saved = localStorage.getItem('rideLinkRecentSearches');
        let list: any[] = saved ? JSON.parse(saved) : [];
        
        // Filter out existing identical query
        list = list.filter(
          item =>
            !(
              item.pickup.toLowerCase().trim() === activePickup.toLowerCase().trim() &&
              item.destination.toLowerCase().trim() === activeDestination.toLowerCase().trim() &&
              item.date === activeDate
            )
        );

        list.unshift(newSearch);
        list = list.slice(0, 5);
        localStorage.setItem('rideLinkRecentSearches', JSON.stringify(list));
        setRecentSearches(list);
      }
    } catch (err) {
      console.error('Error fetching searched rides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearchClick = (search: any) => {
    setPickup(search.pickup);
    setDestination(search.destination);
    setDate(search.date || '');
    fetchActiveRides(undefined, search.pickup, search.destination, search.date);
  };

  const clearFilters = () => {
    setPickup('');
    setDestination('');
    setDate('');
    setSearched(false);
    fetchActiveRides(undefined, '', '', '');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Find Your Match
          </h1>
          <p className="text-slate-500 font-sans mt-1">
            Search scheduled commuter pools and join verified community routes.
          </p>
        </div>

        {/* Search & Filter Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <form onSubmit={fetchActiveRides} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                Pickup Point
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Downtown"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. University"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm cursor-pointer shadow-sm hover:shadow"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              
              {(pickup || destination || date || searched) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition"
                  title="Clear Filters"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Recent Searches:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRecentSearchClick(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs rounded-full font-semibold transition cursor-pointer"
                    >
                      <span>{s.pickup || 'Anywhere'}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span>{s.destination || 'Anywhere'}</span>
                      {s.date && (
                        <span className="text-[10px] text-slate-400 bg-white border border-slate-150 px-1 py-0.5 rounded ml-1 font-mono">
                          {s.date}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-slate-500 text-sm mt-4 font-sans">Compiling optimal routes...</p>
            </div>
          ) : rides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rides.map((ride, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  key={ride.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Trip header info */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-100">
                        <Car className="w-3.5 h-3.5" />
                        Shared Transit
                      </div>
                      <span className="text-2xl font-extrabold text-blue-600 tracking-tight">
                        ${parseFloat(ride.fare).toFixed(2)}
                      </span>
                    </div>

                    {/* Pickup & Destination nodes */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">PICKUP</p>
                          <p className="text-sm font-semibold text-slate-800">{ride.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CornerDownRight className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">DESTINATION</p>
                          <p className="text-sm font-semibold text-slate-800">{ride.destination}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-4">
                      DEP: {new Date(ride.departureTime).toLocaleString(undefined, { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {/* Driver and Seat status details */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                        {ride.driverAvatar ? (
                          <img referrerPolicy="no-referrer" src={ride.driverAvatar} alt={ride.driverName} className="w-full h-full object-cover" />
                        ) : (
                          ride.driverName.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{ride.driverName}</p>
                        <div className="flex items-center text-amber-500 text-[10px] mt-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="ml-1 font-semibold text-slate-500">
                            {ride.driverReviewCount > 0 ? (
                              `${parseFloat(ride.driverAverageRating).toFixed(1)} ★ (${ride.driverReviewCount} rating${ride.driverReviewCount > 1 ? 's' : ''})`
                            ) : (
                              'No reviews'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-sans">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{ride.seatsAvailable}</span>/{ride.seatsTotal} seats
                      </span>
                      <button 
                        onClick={() => onNavigate('ride-details', { rideId: ride.id })}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center gap-1.5 border border-blue-100"
                      >
                        Join Pool
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center max-w-xl mx-auto">
              <Car className="w-12 h-12 text-slate-300" />
              <h3 className="text-lg font-display font-bold text-slate-900 mt-4">No Carpools Found</h3>
              <p className="text-slate-500 text-sm mt-1.5 max-w-sm font-sans leading-relaxed">
                We couldn't find any scheduled carpools matching these filters. Try refining the locations or broaden your dates.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition"
              >
                View All Active Carpools
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
