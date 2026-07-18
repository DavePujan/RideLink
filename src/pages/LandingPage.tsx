import React from 'react';
import { motion } from 'motion/react';
import { Car, Shield, Globe, Users, TrendingDown, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100 py-16 sm:py-24">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Value Proposition */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full tracking-wider uppercase mb-6 border border-blue-100">
                <Car className="w-3.5 h-3.5" />
                The Smart Carpooling Choice
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
                Connect. <span className="text-blue-600">Ride.</span> Save.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 font-sans leading-relaxed">
                RideSathi is a smart peer-to-peer carpooling platform designed for university students, professionals, and daily commuters. Share your journey, split fuel costs, and make sustainable travel a daily habit.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-200"
                  >
                    Enter Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onLogin}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-200"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm transition duration-200"
                >
                  Learn More
                </button>
              </div>

              {/* Quick stats banner */}
              <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">0%</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">Platform Commission</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">100%</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">Verified Users</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">CO₂</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">Eco-Friendly Transit</div>
                </div>
              </div>
            </motion.div>

            {/* Graphical representation / Card mockups */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="bg-gradient-to-tr from-blue-500 to-emerald-400 p-8 rounded-3xl shadow-xl w-full max-w-md text-white flex flex-col justify-between aspect-square relative overflow-hidden">
                {/* Visual patterns */}
                <div className="absolute top-0 right-0 translate-y-12 w-64 h-64 bg-white/10 rounded-full filter blur-xl" />
                <div className="absolute bottom-0 left-0 -translate-x-12 w-64 h-64 bg-black/10 rounded-full filter blur-xl" />

                <div className="relative z-10 flex justify-between items-start">
                  <span className="font-display font-bold text-lg tracking-wider">RIDELINK</span>
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Car className="w-6 h-6" />
                  </div>
                </div>

                <div className="relative z-10 my-6">
                  <div className="text-xs uppercase tracking-widest text-emerald-100 font-semibold mb-1">Active Smart Route</div>
                  <h3 className="text-2xl font-bold font-display leading-tight">Downtown Crossing &rarr; Campus Tech Park</h3>
                  <div className="mt-4 flex gap-4 text-sm bg-black/20 p-3.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div>
                      <p className="text-white/60 text-xs">Departure</p>
                      <p className="font-medium mt-0.5">Today, 5:30 PM</p>
                    </div>
                    <div className="border-l border-white/20 h-8 self-center" />
                    <div>
                      <p className="text-white/60 text-xs">Estimated Fare</p>
                      <p className="font-medium text-emerald-200 mt-0.5">₹150</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-center bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold font-display">A</div>
                    <div>
                      <p className="text-sm font-semibold">Alex Rivera</p>
                      <p className="text-white/60 text-xs">Toyota Prius • Green Class</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-blue-600 text-xs font-bold rounded-lg shadow-sm">
                    3 Seats Left
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Why Commuters Prefer RideSathi
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We focus on building mutual trust, high transparency, and maximum ecological and economical efficiency.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-display">Verified Profiles Only</h3>
                <p className="mt-3 text-slate-600 font-sans text-sm leading-relaxed">
                  We verify driving licenses, email addresses, and phone numbers. Combined with our peer-review system, RideSathi builds a community you can trust.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-100">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-display">Fair Cost Sharing</h3>
                <p className="mt-3 text-slate-600 font-sans text-sm leading-relaxed">
                  Drivers post real fares based only on shared trip expenses. Save up to 75% on daily commute budgets with other riders along your exact coordinates.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-display">Eco-Impact Tracking</h3>
                <p className="mt-3 text-slate-600 font-sans text-sm leading-relaxed">
                  Every ride completed reduces vehicle count on main highways. Check your dynamic dashboard to see your personal saved CO₂ statistics and carbon offset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community / CTA Section */}
      <section className="bg-white py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Ready to join the green carpool network?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Sign up securely in 30 seconds with Google Sign-In and connect with drivers and passengers along your route.
          </p>
          <div className="mt-8 flex justify-center">
            {isAuthenticated ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition"
              >
                Sign In With Google
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider">RideSathi</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; 2026 RideSathi Inc. All rights reserved. Built with pride using Google Cloud SQL and Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
};
