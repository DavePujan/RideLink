import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Search, 
  PlusCircle, 
  BookOpen, 
  User, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  LogIn 
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.tsx';

// Import our custom pages
import { LandingPage } from './pages/LandingPage.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { SearchRides } from './pages/SearchRides.tsx';
import { OfferRide } from './pages/OfferRide.tsx';
import { RideDetails } from './pages/RideDetails.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { MyRidesPage } from './pages/MyRidesPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

function MainApp() {
  const { user, dbUser, token, loading, loginWithGoogle, logout } = useAuth();
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [extraPageData, setExtraPageData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts/unread notification count
  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const unread = data.data.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnread();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle direct navigation
  const navigateTo = (page: string, extraData?: any) => {
    setCurrentPage(page);
    setExtraPageData(extraData);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigateTo('dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-sm mt-4 font-sans">Verifying commuter credentials...</p>
      </div>
    );
  }

  // Define Page Renderer
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={!!user} />;
      case 'dashboard':
        return user ? <Dashboard onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'search-rides':
        return <SearchRides onNavigate={navigateTo} />;
      case 'offer-ride':
        return user ? <OfferRide onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'ride-details':
        return <RideDetails rideId={extraPageData?.rideId} onNavigate={navigateTo} />;
      case 'profile':
        return user ? <ProfilePage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'my-rides':
        return user ? <MyRidesPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'my-bookings':
        return user ? <MyBookingsPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'notifications':
        return user ? <NotificationsPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={false} />;
      case 'admin':
        return user && dbUser?.isAdmin ? <AdminDashboard onNavigate={navigateTo} /> : <Dashboard onNavigate={navigateTo} />;
      default:
        return <LandingPage onNavigate={navigateTo} onLogin={handleLogin} isAuthenticated={!!user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-800">
      
      {/* Platform Navigation Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo / Brand */}
            <div className="flex items-center">
              <button 
                onClick={() => navigateTo('landing')}
                className="flex items-center gap-2 px-1 focus:outline-none cursor-pointer group"
              >
                <div className="p-2 bg-blue-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200 shadow-md shadow-blue-600/10">
                  <Car className="w-5 h-5" />
                </div>
                <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                  RideSathi
                </span>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => navigateTo('search-rides')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${currentPage === 'search-rides' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Search className="w-4 h-4" />
                Find Ride
              </button>
              
              {user && (
                <>
                  <button 
                    onClick={() => navigateTo('offer-ride')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${currentPage === 'offer-ride' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Offer Ride
                  </button>

                  <button 
                    onClick={() => navigateTo('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${currentPage === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    Cockpit
                  </button>

                  {dbUser?.isAdmin && (
                    <button 
                      onClick={() => navigateTo('admin')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${currentPage === 'admin' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin
                    </button>
                  )}
                </>
              )}
            </div>

            {/* User Session controls */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                  {/* Notification Bell */}
                  <button
                    onClick={() => navigateTo('notifications')}
                    className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Profile Dropdown trigger */}
                  <button
                    onClick={() => navigateTo('profile')}
                    className="flex items-center gap-2 p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center font-bold text-sm text-blue-600 border border-blue-200">
                      {dbUser?.profilePictureUrl ? (
                        <img referrerPolicy="no-referrer" src={dbUser.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 pr-2.5 max-w-[100px] truncate">
                      {dbUser?.name || 'User'}
                    </span>
                  </button>

                  {/* Logout Button */}
                  <button 
                    onClick={() => {
                      logout();
                      navigateTo('landing');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2 text-sm">
                <button 
                  onClick={() => navigateTo('search-rides')}
                  className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Find a Carpool
                </button>
                
                {user ? (
                  <>
                    <button 
                      onClick={() => navigateTo('offer-ride')}
                      className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Offer a Carpool
                    </button>
                    <button 
                      onClick={() => navigateTo('dashboard')}
                      className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      User Cockpit
                    </button>
                    <button 
                      onClick={() => navigateTo('profile')}
                      className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      My Profile
                    </button>
                    <button 
                      onClick={() => navigateTo('notifications')}
                      className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 flex justify-between items-center"
                    >
                      <span>My Alerts</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white font-mono text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {dbUser?.isAdmin && (
                      <button 
                        onClick={() => navigateTo('admin')}
                        className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-rose-700 bg-rose-50"
                      >
                        Admin Portal
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        logout();
                        navigateTo('landing');
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-500 border-t border-slate-100"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full text-center px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
                  >
                    Sign In With Google
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Page Rendering Target */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
