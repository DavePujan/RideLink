import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, MapPin, Calendar, Star, Phone, CheckCircle, AlertCircle, XCircle, ArrowLeft, ArrowRight, CornerDownRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MyBookingsPageProps {
  onNavigate: (page: string, extraData?: any) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  
  // States
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Review Dialog States
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching booking history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!token) return;
    const conf = window.confirm('Are you sure you want to cancel this seat reservation?');
    if (!conf) return;

    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchHistory();
      } else {
        alert(data.error || 'Failed to cancel reservation.');
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedBookingForReview) return;
    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: selectedBookingForReview.rideId,
          revieweeId: selectedBookingForReview.driverId,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewSuccess(false);
          setSelectedBookingForReview(null);
          setComment('');
          setRating(5);
        }, 1500);
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Nav Back */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Page title */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              My Bookings
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Inspect your reservations, verify driver phone contacts, or leave completed trip feedback.
            </p>
          </div>
          <button
            onClick={() => onNavigate('search-rides')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
          >
            Find Carpools
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-3">Compiling booking logs history...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-6">
            {history.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      booking.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      Booking: {booking.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      booking.rideStatus === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      booking.rideStatus === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      booking.rideStatus === 'COMPLETED' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      Ride: {booking.rideStatus}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">B-ID: #{booking.id}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-800 font-bold">
                    <span className="text-sm">{booking.pickupLocation}</span>
                    <span className="text-slate-400 text-xs hidden sm:inline">&rarr;</span>
                    <span className="text-sm">{booking.destination}</span>
                  </div>

                  {/* Driver contact and parameters */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs">
                      {booking.driverAvatar ? (
                        <img referrerPolicy="no-referrer" src={booking.driverAvatar} alt="Driver" className="w-full h-full object-cover" />
                      ) : (
                        booking.driverName.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Driver: {booking.driverName}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {booking.driverPhone || 'No contact published'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Departure</p>
                      <p className="mt-0.5 font-mono">{new Date(booking.departureTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Seats Booked</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{booking.seatsBooked} Seat{booking.seatsBooked > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide">Fare Total</p>
                      <p className="mt-0.5 text-blue-600 font-bold">${(parseFloat(booking.fare) * booking.seatsBooked).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && booking.rideStatus === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {booking.status === 'PENDING' ? 'Withdraw Request' : 'Cancel Seat'}
                    </button>
                  )}

                  {booking.rideStatus === 'COMPLETED' && booking.status === 'CONFIRMED' && (
                    booking.alreadyReviewed ? (
                      <span className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl">
                        <Check className="w-3.5 h-3.5" />
                        Rated
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedBookingForReview(booking)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition cursor-pointer animate-none"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-none" />
                        Rate Driver
                      </button>
                    )
                  )}

                  <button
                    onClick={() => onNavigate('ride-details', { rideId: booking.rideId })}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    View Ride
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-300" />
            <h3 className="text-lg font-display font-bold mt-4 text-slate-900">No Reservations Found</h3>
            <p className="text-slate-500 text-sm mt-1.5 font-sans max-w-sm leading-relaxed font-sans">
              You haven't reserved any carpool rides yet. Search scheduled routes to book seats.
            </p>
            <button
              onClick={() => onNavigate('search-rides')}
              className="mt-6 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-blue-700 transition"
            >
              Search Rides Now
            </button>
          </div>
        )}

        {/* Review Dialog Overlay */}
        {selectedBookingForReview && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setSelectedBookingForReview(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>

              <h3 className="text-lg font-display font-extrabold text-slate-900 mb-2">
                Rate Your Journey Experience
              </h3>
              <p className="text-xs text-slate-500 font-sans mb-6">
                Your feedback helps RideLink maintain a trusted commute environment. Reviewing: <strong>{selectedBookingForReview.driverName}</strong>.
              </p>

              {reviewSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-950">Review Saved Successfully</h4>
                  <p className="text-xs text-slate-500 font-sans">Syncing feedback score card...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Experience Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRating(stars)}
                          className="text-amber-400 hover:scale-110 transition shrink-0"
                        >
                          <Star 
                            className={`w-8 h-8 ${stars <= rating ? 'fill-current' : 'text-slate-200'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Commentary Feedback
                    </label>
                    <textarea
                      required
                      placeholder="Share your driving feedback (e.g. safe driver, friendly, arrived on time...)"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none font-sans"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForReview(null)}
                      className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm shadow-sm"
                    >
                      {reviewLoading ? 'Saving...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};
