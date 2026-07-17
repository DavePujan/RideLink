import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Phone, ShieldCheck, Car, Trash2, CheckCircle, AlertCircle, PlusCircle, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { token, dbUser, refreshDbUser } = useAuth();
  
  // Profile States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Vehicle States
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vColor, setVColor] = useState('');
  const [vCapacity, setVCapacity] = useState('');
  const [vehicleSuccess, setVehicleSuccess] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // Community Rating States
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name);
      setPhone(dbUser.phone || '');
      setLicenseNumber(dbUser.licenseNumber || '');
      setProfilePictureUrl(dbUser.profilePictureUrl || '');
    }
    fetchVehicles();
    fetchProfileStats();
  }, [dbUser, token]);

  const fetchProfileStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setAverageRating(resData.data.averageRating || 0);
        setReviewCount(resData.data.reviewCount || 0);
      }
    } catch (e) {
      console.error('Error fetching rating stats:', e);
    }
  };

  const fetchVehicles = async () => {
    if (!token) return;
    setVehiclesLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileLoading(true);
    setError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          licenseNumber,
          profilePictureUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccess(true);
        await refreshDbUser();
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile update.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setVehicleLoading(true);
    setError(null);
    setVehicleSuccess(false);

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
        setVehicleSuccess(true);
        setVMake('');
        setVModel('');
        setVPlate('');
        setVColor('');
        setVCapacity('');
        await fetchVehicles();
      } else {
        setError(data.error || 'Failed to add vehicle.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during vehicle creation.');
    } finally {
      setVehicleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Account Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Update your personal contact details, driving licenses, or register vehicle assets.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Personal Info Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-base font-display font-bold text-slate-950">
                  Personal Details
                </h2>
              </div>

              {reviewCount > 0 && (
                <div className="mb-5 p-3.5 bg-amber-50/65 border border-amber-200/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Verified Rating</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">Based on {reviewCount} rating{reviewCount > 1 ? 's' : ''} left by other members.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm text-xs font-bold text-amber-700 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    {averageRating.toFixed(1)}
                  </div>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Profile parameters successfully synchronized.
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Driving License Details
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. DL-99238-X"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="pl-10 w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm cursor-pointer shadow-sm"
                  >
                    {profileLoading ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Vehicles Form & Lists */}
          <div className="space-y-6">
            
            {/* Vehicle List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Car className="w-5 h-5" />
                </div>
                <h2 className="text-base font-display font-bold text-slate-950">
                  My Registered Vehicles
                </h2>
              </div>

              {vehiclesLoading ? (
                <div className="text-center py-6 text-slate-400 text-xs">Loading vehicles...</div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((veh) => (
                    <div key={veh.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {veh.color} {veh.make} {veh.model}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                            Plate: {veh.registrationPlate} • Max Seats: {veh.capacity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs leading-relaxed font-sans">
                  No vehicles registered yet. Add a vehicle below to qualify for offering carpools.
                </div>
              )}
            </div>

            {/* Add Vehicle Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-display font-bold text-slate-950">
                  Register Another Vehicle
                </h2>
              </div>

              {vehicleSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Vehicle added successfully.
                </div>
              )}

              <form onSubmit={handleAddVehicle} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Make (Toyota)"
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Model (Prius)"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="License Plate"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Color (Gray)"
                    value={vColor}
                    onChange={(e) => setVColor(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <select
                    required
                    value={vCapacity}
                    onChange={(e) => setVCapacity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">Passenger Seating Capacity</option>
                    <option value="1">1 Seat</option>
                    <option value="2">2 Seats</option>
                    <option value="3">3 Seats</option>
                    <option value="4">4 Seats</option>
                    <option value="5">5 Seats</option>
                    <option value="6">6 Seats</option>
                    <option value="7">7 Seats</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={vehicleLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm cursor-pointer shadow-sm"
                  >
                    {vehicleLoading ? 'Adding...' : 'Register Vehicle'}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
