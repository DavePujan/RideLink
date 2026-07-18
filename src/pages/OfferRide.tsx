import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, MapPin, Calendar, IndianRupee, Users, AlertCircle, Sparkles, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface OfferRideProps {
  onNavigate: (page: string) => void;
}

export const OfferRide: React.FC<OfferRideProps> = ({ onNavigate }) => {
  const { token, dbUser } = useAuth();
  
  // States
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form Fields - Ride
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [depDate, setDepDate] = useState('');
  const [depTime, setDepTime] = useState('');
  const [fare, setFare] = useState('');
  const [seats, setSeats] = useState('');

  // Form Fields - Vehicle Register (Fallback if none exist)
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vColor, setVColor] = useState('');
  const [vCapacity, setVCapacity] = useState('');
  const [loadingVehicleSubmit, setLoadingVehicleSubmit] = useState(false);

  useEffect(() => {
    fetchUserVehicles();
  }, [token]);

  const fetchUserVehicles = async () => {
    if (!token) return;
    setLoadingVehicles(true);
    try {
      const res = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
        if (data.data.length > 0) {
          setSelectedVehicleId(data.data[0].id.toString());
          setSeats(data.data[0].capacity.toString());
        } else {
          setShowVehicleForm(true);
        }
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoadingVehicleSubmit(true);
    setError(null);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          make: vMake,
          model: vModel,
          registrationPlate: vPlate,
          color: vColor,
          capacity: parseInt(vCapacity, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVMake('');
        setVModel('');
        setVPlate('');
        setVColor('');
        setVCapacity('');
        setShowVehicleForm(false);
        await fetchUserVehicles();
      } else {
        setError(data.error || 'Failed to register vehicle.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during vehicle registration.');
    } finally {
      setLoadingVehicleSubmit(false);
    }
  };

  const handlePostRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoadingSubmit(true);
    setError(null);

    const departureTime = `${depDate}T${depTime}:00`;

    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          pickupLocation: pickup,
          destination: destination,
          departureTime: departureTime,
          fare: parseFloat(fare),
          seatsTotal: parseInt(seats, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Failed to offer ride.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during ride creation.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Offer a Carpool Ride
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Connect with commuters, share fuel costs, and reduce traffic congestion.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Ride Listed Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">Redirecting you to your dashboard hub...</p>
            </div>
          </div>
        )}

        {loadingVehicles ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-3">Loading active profile parameters...</p>
          </div>
        ) : showVehicleForm ? (
          /* Vehicle Registration Form */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display font-bold text-slate-950">
                Register Your Vehicle Details
              </h2>
            </div>
            
            <p className="text-slate-500 text-xs mb-6 -mt-3">
              To offer a carpool ride, we need your active vehicle parameters to display transparently for passengers.
            </p>

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prius"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    License Plate
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7XYZ99"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Exterior Color
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metallic Gray"
                    value={vColor}
                    onChange={(e) => setVColor(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Max Passenger Capacity
                </label>
                <select
                  required
                  value={vCapacity}
                  onChange={(e) => setVCapacity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                >
                  <option value="">Select Seating Capacity</option>
                  <option value="1">1 Passenger Seat</option>
                  <option value="2">2 Passenger Seats</option>
                  <option value="3">3 Passenger Seats</option>
                  <option value="4">4 Passenger Seats</option>
                  <option value="5">5 Passenger Seats</option>
                  <option value="6">6 Passenger Seats</option>
                  <option value="7">7 Passenger Seats</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                {vehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowVehicleForm(false)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loadingVehicleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {loadingVehicleSubmit ? 'Registering...' : 'Register Vehicle & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Offer Ride Form */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm"
          >
            <form onSubmit={handlePostRide} className="space-y-6">
              
              {/* Vehicle Selection Header info */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Driver Vehicle Selected</h2>
                    {selectedVehicle && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedVehicle.color} {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.registrationPlate})
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleForm(true)}
                  className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add/Change Vehicle
                </button>
              </div>

              {/* Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Central Station, Gate 2"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Destination Point
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Park Block C"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Departure Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={depDate}
                      onChange={(e) => setDepDate(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    required
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Pricing & Seats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cost Per Passenger (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      placeholder="e.g. 150"
                      value={fare}
                      onChange={(e) => setFare(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Available Carpool Seats
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedVehicle?.capacity || 8}
                      placeholder={selectedVehicle ? `Max ${selectedVehicle.capacity}` : 'Seating limit'}
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-5 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  {loadingSubmit ? 'Listing ride...' : 'Publish Commute Listing'}
                  <Sparkles className="w-4 h-4 text-white fill-current" />
                </button>
              </div>

            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
};
