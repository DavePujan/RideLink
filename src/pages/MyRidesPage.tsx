import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, MapPin, Calendar, Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Play, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MyRidesPageProps {
  onNavigate: (page: string, extraData?: any) => void;
}

export const MyRidesPage: React.FC<MyRidesPageProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRides();
  }, [token]);

  const fetchMyRides = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rides/driver', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRides(data.data);
      }
    } catch (err) {
      console.error('Error fetching driver rides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId: number, status: string) => {
    if (!token) return;
    setActionLoadingId(rideId);
    setInfoMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMyRides();
        if (status === 'COMPLETED') {
          setInfoMessage('Ride marked as COMPLETED! Click "View Details" to submit review feedback for your passengers.');
        } else if (status === 'ACTIVE') {
          setInfoMessage('Ride is now ACTIVE! Drive safely!');
        } else if (status === 'CANCELLED') {
          setInfoMessage('Ride cancelled successfully.');
        }
      } else {
        setErrorMessage(data.error || 'Failed to update ride status.');
      }
    } catch (err) {
      console.error('Error updating ride status:', err);
      setErrorMessage('An error occurred while updating ride status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Back */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {infoMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-sans flex items-center justify-between">
            <span>{infoMessage}</span>
            <button onClick={() => setInfoMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-sans flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              My Offered Rides
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Publish trip status, complete routes, or manage your riders list.
            </p>
          </div>
          <button
            onClick={() => onNavigate('offer-ride')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
          >
            Offer New Ride
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-3">Compiling active hosted rides...</p>
          </div>
        ) : rides.length > 0 ? (
          <div className="space-y-6">
            {rides.map((ride) => (
              <div 
                key={ride.id} 
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      ride.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      ride.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      ride.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {ride.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: #{ride.id}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-800 font-bold">
                    <span className="text-sm">{ride.pickupLocation}</span>
                    <span className="text-slate-400 text-xs hidden sm:inline">&rarr;</span>
                    <span className="text-sm">{ride.destination}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Departure</p>
                      <p className="mt-0.5 font-mono">{new Date(ride.departureTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Seats Status</p>
                      <p className="mt-0.5 font-sans font-semibold text-slate-700">{ride.seatsAvailable} available / {ride.seatsTotal} total</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Fare Rate</p>
                      <p className="mt-0.5 text-blue-600 font-bold">${parseFloat(ride.fare).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  {ride.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(ride.id, 'ACTIVE')}
                        disabled={actionLoadingId === ride.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-xs rounded-xl transition shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Journey
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ride.id, 'CANCELLED')}
                        disabled={actionLoadingId === ride.id}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition"
                      >
                        Cancel Ride
                      </button>
                    </>
                  )}

                  {ride.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(ride.id, 'COMPLETED')}
                      disabled={actionLoadingId === ride.id}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Complete Journey
                    </button>
                  )}

                  <button
                    onClick={() => onNavigate('ride-details', { rideId: ride.id })}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center">
            <Car className="w-12 h-12 text-slate-300" />
            <h3 className="text-lg font-display font-bold mt-4 text-slate-900">No Offered Rides</h3>
            <p className="text-slate-500 text-sm mt-1.5 font-sans max-w-sm leading-relaxed">
              You haven't listed any commuter routes yet. Start offering empty carpool seats to share commutes.
            </p>
            <button
              onClick={() => onNavigate('offer-ride')}
              className="mt-6 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-blue-700 transition"
            >
              Post a Ride Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
