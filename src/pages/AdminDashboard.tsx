import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Car, CheckSquare, ArrowLeft, ShieldCheck, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { token, dbUser } = useAuth();
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allRides, setAllRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'users' | 'rides'>('stats');
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (usersData.success) setAllUsers(usersData.data);

      const ridesRes = await fetch('/api/admin/rides', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const ridesData = await ridesRes.json();
      if (ridesData.success) setAllRides(ridesData.data);

    } catch (err) {
      console.error('Error fetching admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUid: string) => {
    if (!token || actionLoadingUid) return;
    if (targetUid === dbUser?.uid) {
      alert('You cannot revoke your own administrator privileges!');
      return;
    }

    setActionLoadingUid(targetUid);
    try {
      const res = await fetch(`/api/admin/users/${targetUid}/toggle-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Refresh users and stats
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to toggle administrator status.');
      }
    } catch (err) {
      console.error('Error toggling administrator status:', err);
    } finally {
      setActionLoadingUid(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Nav Back */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-100 tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            SYSTEM ADMINISTRATOR
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            RideSathi Administrator Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Platform health statistics, active user profiles, and carpool listing moderation panel.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-8 gap-6 text-sm">
          <button
            onClick={() => setTab('stats')}
            className={`pb-3 font-semibold ${tab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Core Metrics
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 font-semibold ${tab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Registered Commuters ({allUsers.length})
          </button>
          <button
            onClick={() => setTab('rides')}
            className={`pb-3 font-semibold ${tab === 'rides' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
          >
            All Scheduled Rides ({allRides.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-3">Compiling platform ledger registries...</p>
          </div>
        ) : (
          <>
            {/* Tab Content: Stats */}
            {tab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Total Commuters</p>
                    <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-1">{stats.totalUsers}</h3>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <Car className="w-8 h-8 text-emerald-600 mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Total Rides Offered</p>
                    <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-1">{stats.totalRides}</h3>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <CheckSquare className="w-8 h-8 text-purple-600 mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Total Bookings</p>
                    <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-1">{stats.totalBookings}</h3>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <Sparkles className="w-8 h-8 text-amber-500 mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Active Carpools</p>
                    <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-1">{stats.activeRides}</h3>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
                  <h3 className="text-lg font-display font-bold leading-snug">
                    Commuter Security & Verification Audit
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                    RideSathi operates as a trusted university and corporate network. Administrators have the responsibility to ensure all drivers present a valid driving license number before scheduled departure dates to maintain safe transit metrics.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Content: Users */}
            {tab === 'users' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Commuter</th>
                      <th className="p-4">Driving License</th>
                      <th className="p-4">System Role</th>
                      <th className="p-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {allUsers.map((usr) => (
                      <tr key={usr.uid} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                              {usr.profilePictureUrl ? (
                                <img referrerPolicy="no-referrer" src={usr.profilePictureUrl} alt={usr.name} className="w-full h-full object-cover" />
                              ) : (
                                usr.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{usr.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{usr.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-mono">
                          {usr.licenseNumber ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold font-sans">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              {usr.licenseNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">None registered</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${usr.isAdmin ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-600'}`}>
                            {usr.isAdmin ? 'System Admin' : 'Commuter'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleAdmin(usr.uid)}
                            disabled={actionLoadingUid === usr.uid || usr.uid === dbUser?.uid}
                            className={`inline-flex items-center gap-1 font-bold ${
                              usr.isAdmin ? 'text-rose-600 hover:text-rose-700' : 'text-blue-600 hover:text-blue-700'
                            } disabled:opacity-30`}
                          >
                            {usr.isAdmin ? (
                              <>
                                <ToggleRight className="w-5 h-5 shrink-0" />
                                Revoke Admin
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-5 h-5 shrink-0" />
                                Make Admin
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab Content: Rides */}
            {tab === 'rides' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Route ID & Paths</th>
                      <th className="p-4">Host Driver</th>
                      <th className="p-4">Seating</th>
                      <th className="p-4">Fares</th>
                      <th className="p-4 text-right">Route Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {allRides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">
                            #{ride.id} {ride.pickupLocation} &rarr; {ride.destination}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(ride.departureTime).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{ride.driverName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ride.driverEmail}</p>
                        </td>
                        <td className="p-4 text-slate-600">
                          {ride.seatsAvailable} of {ride.seatsTotal} available
                        </td>
                        <td className="p-4 font-bold text-blue-600">
                          ₹{parseFloat(ride.fare).toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ride.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            ride.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            ride.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {ride.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
