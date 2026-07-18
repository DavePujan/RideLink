import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  PlusCircle, 
  BookOpen, 
  History, 
  Bell, 
  User, 
  ShieldAlert, 
  Car, 
  Sparkles, 
  TrendingUp, 
  Leaf,
  MapPin,
  CornerDownRight,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardProps {
  onNavigate: (page: string, extraData?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { dbUser, token } = useAuth();
  const [stats, setStats] = useState({
    tripsBooked: 0,
    tripsOffered: 0,
    savedCo2: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [dashTripProgress, setDashTripProgress] = useState(0);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      if (!token) return;
      try {
        // Fetch bookings
        const bookingsRes = await fetch('/api/bookings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const bookingsData = await bookingsRes.json();

        // Fetch driver rides
        const ridesRes = await fetch('/api/rides/driver', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const ridesData = await ridesRes.json();

        // Fetch notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const notifData = await notifRes.json();

        const activeBookingsCount = bookingsData.success 
          ? bookingsData.data.filter((b: any) => b.status === 'CONFIRMED').length 
          : 0;

        const activeRidesCount = ridesData.success 
          ? ridesData.data.filter((r: any) => r.status === 'SCHEDULED' || r.status === 'ACTIVE').length 
          : 0;

        setStats({
          tripsBooked: activeBookingsCount,
          tripsOffered: activeRidesCount,
          savedCo2: (activeBookingsCount + activeRidesCount) * 4.2, // ~4.2kg CO2 saved per shared carpool
        });

        // Find driver active ride
        const driverActive = ridesData.success 
          ? ridesData.data.find((r: any) => r.status === 'ACTIVE') 
          : null;

        // Find passenger active ride
        const passengerActive = bookingsData.success 
          ? bookingsData.data.find((b: any) => b.status === 'CONFIRMED' && b.rideStatus === 'ACTIVE') 
          : null;

        if (driverActive) {
          setActiveTrip({
            id: driverActive.id,
            pickupLocation: driverActive.pickupLocation,
            destination: driverActive.destination,
            departureTime: driverActive.departureTime,
            role: 'driver',
          });
        } else if (passengerActive) {
          setActiveTrip({
            id: passengerActive.rideId,
            pickupLocation: passengerActive.pickupLocation,
            destination: passengerActive.destination,
            departureTime: passengerActive.departureTime,
            role: 'passenger',
          });
        } else {
          setActiveTrip(null);
        }

        if (notifData.success) {
          setRecentNotifications(notifData.data.slice(0, 3));
        }

      } catch (err) {
        console.error('Failed to load dashboard details:', err);
      }
    };

    fetchDashboardDetails();
  }, [token]);

  // Calculate live progress for dashboard active ride
  useEffect(() => {
    if (activeTrip) {
      const calculateProgress = () => {
        const depTime = new Date(activeTrip.departureTime).getTime();
        const duration = 45 * 60 * 1000; // standard 45-minute route duration
        const elapsed = Date.now() - depTime;
        const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
        setDashTripProgress(pct);
      };
      calculateProgress();
      const interval = setInterval(calculateProgress, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTrip]);

  const getEstimatedArrival = (departureTimeStr: string) => {
    try {
      const dep = new Date(departureTimeStr);
      const arr = new Date(dep.getTime() + 45 * 60 * 1000);
      return arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full filter blur-3xl opacity-50 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 overflow-hidden">
              {dbUser?.profilePictureUrl ? (
                <img referrerPolicy="no-referrer" src={dbUser.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Hello, {dbUser?.name || 'Commuter'}!
                  <Sparkles className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
                </h1>
                {dbUser?.reviewCount && dbUser.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200/50 shadow-sm shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {dbUser.averageRating?.toFixed(1)} ({dbUser.reviewCount} rating{dbUser.reviewCount > 1 ? 's' : ''})
                  </span>
                ) : null}
              </div>
              <p className="text-slate-500 mt-1 font-sans">
                Welcome to your RideSathi cockpit. Ready to share a ride today?
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 w-full md:w-auto">
            {dbUser?.isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm rounded-xl border border-rose-200 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Portal
              </button>
            )}
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition"
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
          </div>
        </div>

        {/* Active Trip Status Progress Bar */}
        {activeTrip && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mt-8 border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full filter blur-3xl opacity-10 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-500/25 tracking-wider uppercase font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  Live Trip Tracked
                </div>
                <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
                  You are currently on a carpool commute as the <strong className="text-emerald-400 font-bold capitalize">{activeTrip.role}</strong>.
                </p>
              </div>
              <div className="flex flex-col md:items-end text-xs text-slate-400 font-sans">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">EST. ARRIVAL</span>
                <span className="text-base font-bold text-white mt-0.5 font-mono">
                  {getEstimatedArrival(activeTrip.departureTime)}
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-500">START POINT</p>
                    <p className="text-sm font-semibold text-white truncate">{activeTrip.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 justify-end text-right">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-500">END POINT</p>
                    <p className="text-sm font-semibold text-blue-300 truncate">{activeTrip.destination}</p>
                  </div>
                  <CornerDownRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative pt-1">
                <div className="overflow-hidden h-2.5 text-xs flex rounded bg-slate-800">
                  <div 
                    style={{ width: `${Math.round(dashTripProgress)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="font-mono">Departed: {new Date(activeTrip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400">{Math.round(dashTripProgress)}% COMPLETE</span>
                  <button
                    onClick={() => onNavigate('ride-details', { rideId: activeTrip.id })}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    Manage / Coordinate Chat &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Bookings</p>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-0.5">{stats.tripsBooked}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Offered Rides</p>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-0.5">{stats.tripsOffered}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">CO₂ Offset Saved</p>
              <h3 className="text-2xl font-display font-extrabold text-emerald-600 mt-0.5">{stats.savedCo2.toFixed(1)} kg</h3>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-8">
          <h2 className="text-lg font-display font-bold text-slate-950 mb-4">Quick Commute Operations</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => onNavigate('search-rides')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-slate-900 group-hover:text-blue-600 transition">Find a Carpool</h4>
                <p className="text-slate-500 text-xs mt-1.5 font-sans leading-relaxed">
                  Search available driver listings matching your pickup coordinates and departure dates.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('offer-ride')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-slate-900 group-hover:text-emerald-600 transition">Offer a Carpool</h4>
                <p className="text-slate-500 text-xs mt-1.5 font-sans leading-relaxed">
                  Have empty seats in your car? List your route, pick passenger capacities, and share fuel costs.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('my-bookings')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center mb-4 border border-slate-100 group-hover:bg-slate-800 group-hover:text-white transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-slate-900 group-hover:text-slate-800 transition">My Passenger Bookings</h4>
                <p className="text-slate-500 text-xs mt-1.5 font-sans leading-relaxed">
                  Track your booked seats, view active driver contact details, or trigger booking cancellations.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('my-rides')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center mb-4 border border-slate-100 group-hover:bg-slate-800 group-hover:text-white transition">
                  <History className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-slate-900 group-hover:text-slate-800 transition">My Offered Carpools</h4>
                <p className="text-slate-500 text-xs mt-1.5 font-sans leading-relaxed">
                  Manage your posted listings, update status, complete trips, or inspect booked passengers list.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Context: Recent Notifications & Eco-score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Notifications Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-slate-950 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Recent Alerts
              </h3>
              <button 
                onClick={() => onNavigate('notifications')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((n) => (
                  <div key={n.id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" style={{ opacity: n.isRead ? 0.3 : 1 }} />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{n.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-sans">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm font-sans">
                  No notifications yet. You will see booking alerts and ride updates here.
                </div>
              )}
            </div>
          </div>

          {/* Eco score / University circles Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/20">
                <Leaf className="w-3.5 h-3.5" />
                ECO LEADERBOARD
              </div>
              <h3 className="text-xl font-display font-bold mt-4 leading-snug">
                Your Shared Commute Carbon Contribution
              </h3>
              <p className="text-slate-300 text-xs mt-2 font-sans leading-relaxed">
                By pooling coordinates and sharing vehicle assets instead of driving separately, you are actively participating in reducing urban carbon congestion.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total Saved Miles</p>
                <p className="text-lg font-bold mt-0.5 text-blue-300 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {((stats.tripsBooked + stats.tripsOffered) * 12).toFixed(0)} mi
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-sans">Rank Level</p>
                <p className="text-sm font-semibold text-emerald-400 font-display">Seed Saver 🌿</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
