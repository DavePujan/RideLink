import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Calendar, 
  Car, 
  User, 
  Star, 
  Phone, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Users, 
  CornerDownRight,
  Sparkles,
  Check,
  MessageSquare,
  Clock,
  UserX,
  UserCheck,
  XCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface RideDetailsProps {
  rideId: number;
  onNavigate: (page: string) => void;
}

export const RideDetails: React.FC<RideDetailsProps> = ({ rideId, onNavigate }) => {
  const { token, dbUser } = useAuth();
  
  // States
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSeats, setBookingSeats] = useState('1');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Coordination Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [tripProgress, setTripProgress] = useState(0);

  // Passenger Review States
  const [activeReviewPassenger, setActiveReviewPassenger] = useState<any>(null);
  const [passengerRating, setPassengerRating] = useState(5);
  const [passengerComment, setPassengerComment] = useState('');
  const [passengerReviewLoading, setPassengerReviewLoading] = useState(false);
  const [passengerReviewSuccess, setPassengerReviewSuccess] = useState<Record<string, boolean>>({});
  const [acceptRejectLoadingId, setAcceptRejectLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const fetchRideDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rides/${rideId}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        setError(resData.error || 'Failed to fetch ride details.');
      }
    } catch (err) {
      console.error('Error fetching ride details:', err);
      setError('An error occurred while retrieving ride details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to book a ride.');
      return;
    }
    setBookingLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: rideId,
          seatsBooked: parseInt(bookingSeats, 10),
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('my-bookings');
        }, 1500);
      } else {
        setError(resData.error || 'Failed to complete booking.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: number) => {
    if (!token) return;
    setAcceptRejectLoadingId(bookingId);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchRideDetails();
      } else {
        setError(resData.error || 'Failed to accept booking request.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while approving booking.');
    } finally {
      setAcceptRejectLoadingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    if (!token) return;
    const conf = window.confirm('Are you sure you want to decline this booking request?');
    if (!conf) return;
    setAcceptRejectLoadingId(bookingId);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchRideDetails();
      } else {
        setError(resData.error || 'Failed to decline booking request.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while declining booking.');
    } finally {
      setAcceptRejectLoadingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!token) return;
    const conf = window.confirm('Are you sure you want to cancel this booking?');
    if (!conf) return;
    setBookingLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchRideDetails();
      } else {
        setError(resData.error || 'Failed to cancel booking.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while cancelling booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Extract variables
  const ride = data?.ride;
  const reviews = data?.reviews || [];
  const bookings = data?.bookings || [];

  const driverReviewsCount = reviews.length;
  const driverAverageRating = driverReviewsCount > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / driverReviewsCount
    : 0;

  const isDriver = dbUser?.uid === ride?.driverId;
  const isPassenger = bookings.some((b: any) => b.passengerId === dbUser?.uid && b.status === 'CONFIRMED');
  const isParticipant = isDriver || isPassenger;

  // Polling for chat messages
  const fetchMessages = async () => {
    if (!token || !isParticipant) return;
    try {
      const res = await fetch(`/api/rides/${rideId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setChatMessages(resData.data);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    }
  };

  useEffect(() => {
    if (isParticipant && token) {
      fetchMessages();
      const chatInterval = setInterval(fetchMessages, 3000);
      return () => clearInterval(chatInterval);
    }
  }, [rideId, token, isParticipant]);

  // Scroll chat to bottom
  useEffect(() => {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages]);

  // Calculate live progress for active ride
  useEffect(() => {
    if (ride?.status === 'ACTIVE') {
      const calculateProgress = () => {
        const depTime = new Date(ride.departureTime).getTime();
        const duration = 45 * 60 * 1000; // standard 45-minute estimated route duration
        const elapsed = Date.now() - depTime;
        const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
        setTripProgress(pct);
      };
      calculateProgress();
      const interval = setInterval(calculateProgress, 10000);
      return () => clearInterval(interval);
    }
  }, [ride]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newMessageText.trim()) return;

    try {
      const res = await fetch(`/api/rides/${rideId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMessageText })
      });
      const resData = await res.json();
      if (resData.success) {
        setChatMessages(prev => [...prev, resData.data]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handlePassengerReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeReviewPassenger) return;
    setPassengerReviewLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rideId,
          revieweeId: activeReviewPassenger.passengerId,
          rating: passengerRating,
          comment: passengerComment
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setPassengerReviewSuccess(prev => ({ ...prev, [activeReviewPassenger.passengerId]: true }));
        setActiveReviewPassenger(null);
        setPassengerRating(5);
        setPassengerComment('');
      } else {
        alert(resData.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPassengerReviewLoading(false);
    }
  };

  const getEstimatedArrival = (departureTimeStr: string) => {
    try {
      const dep = new Date(departureTimeStr);
      const arr = new Date(dep.getTime() + 45 * 60 * 1000);
      return arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-xs mt-3 font-sans">Retrieving carpool details...</p>
      </div>
    );
  }

  if (!data || !data.ride) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-display font-bold mt-4 text-slate-900">Ride Not Found</h3>
          <p className="text-slate-500 text-sm mt-1.5 font-sans">
            The requested carpool is either completed, cancelled, or doesn't exist anymore.
          </p>
          <button
            onClick={() => onNavigate('search-rides')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl transition hover:bg-blue-700"
          >
            Back to Searches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation back button */}
        <button
          onClick={() => onNavigate('search-rides')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Searches
        </button>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Ride Booked Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">Your seat reservation is confirmed. Redirecting to your bookings ledger...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Carpool Information Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Trip Status Progress Card */}
            {ride.status === 'ACTIVE' && (
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full filter blur-3xl opacity-15 pointer-events-none" />
                <div className="flex justify-between items-center mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-500/20 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    LIVE TRIP IN PROGRESS
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    EST. ARRIVAL: {getEstimatedArrival(ride.departureTime)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold font-sans">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[150px]">{ride.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-300">
                      <span>{ride.destination}</span>
                      <CornerDownRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-800">
                      <div 
                        style={{ width: `${Math.round(tripProgress)}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className="font-mono">Departed: {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold text-emerald-400">{Math.round(tripProgress)}% Complete</span>
                  </div>
                </div>
              </div>
            )}

            {/* Route Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-100">
                  Shared Route
                </span>
                <span className="text-xl font-extrabold text-blue-600 tracking-tight">
                  ${parseFloat(ride.fare).toFixed(2)} / Seat
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Pickup Point</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{ride.pickupLocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CornerDownRight className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Destination Coordinate</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{ride.destination}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-6 text-slate-500 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Departure: {new Date(ride.departureTime).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Driver & Vehicle Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans">
                Host Operator & Vehicle Asset
              </h3>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                    {ride.driverAvatar ? (
                      <img referrerPolicy="no-referrer" src={ride.driverAvatar} alt={ride.driverName} className="w-full h-full object-cover" />
                    ) : (
                      ride.driverName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{ride.driverName}</h4>
                    {driverReviewsCount > 0 ? (
                      <div className="flex items-center text-amber-500 text-xs mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="ml-1 font-bold text-slate-800">{driverAverageRating.toFixed(1)}</span>
                        <span className="ml-1 text-slate-500 font-medium">({driverReviewsCount} rating{driverReviewsCount > 1 ? 's' : ''})</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[10px] mt-0.5 font-sans">No ratings yet</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1 font-mono">{ride.driverPhone || 'No listed phone'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-slate-400 shrink-0" />
                    Vehicle: <span className="font-bold text-slate-800">{ride.vehicleColor} {ride.vehicleMake} {ride.vehicleModel}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    Plate: <span className="font-bold text-slate-800 uppercase">{ride.vehiclePlate}</span>
                  </span>
                  {ride.driverLicense && (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      Driving License Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Pickup Coordination Chat */}
            {isParticipant && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-[400px]">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans">
                      Ride Coordination Chat
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Coordinate pickup spots, delays, and details with your carpool circle.</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-time
                  </span>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1" id="chat-messages-container">
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg: any) => {
                      const isMe = msg.senderId === dbUser?.uid;
                      return (
                        <div key={msg.id} className={`flex items-start gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 overflow-hidden shrink-0">
                            {msg.senderAvatar ? (
                              <img referrerPolicy="no-referrer" src={msg.senderAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              msg.senderName.charAt(0)
                            )}
                          </div>
                          <div>
                            {!isMe && <p className="text-[9px] font-bold text-slate-500 mb-0.5 ml-1">{msg.senderName}</p>}
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                              {msg.text}
                            </div>
                            <span className={`text-[8px] text-slate-400 mt-0.5 block font-mono ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                      <p className="font-semibold text-slate-500">No coordination messages yet</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] text-center">Send a message to discuss your upcoming pickup location!</p>
                    </div>
                  )}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type coordination message..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer animate-none"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans">
                Driver Reviews ({reviews.length})
              </h3>

              <div className="divide-y divide-slate-100">
                {reviews.length > 0 ? (
                  reviews.map((rev: any) => (
                    <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0">
                            {rev.reviewerAvatar ? (
                              <img referrerPolicy="no-referrer" src={rev.reviewerAvatar} alt="Reviewer" className="w-full h-full object-cover" />
                            ) : (
                              rev.reviewerName.charAt(0)
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{rev.reviewerName}</span>
                        </div>
                        <div className="flex items-center text-amber-500 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs mt-2 italic font-sans leading-relaxed">
                        "{rev.comment || 'No comment left.'}"
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No ratings listed yet. Be the first to share feedback after completion!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Booking Seat Card Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6">
              
              <h3 className="text-base font-display font-extrabold text-slate-900 tracking-tight mb-4">
                Claim Seating
              </h3>

              {(() => {
                if (isDriver) {
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs font-sans leading-relaxed">
                      <p className="font-bold">You are hosting this ride!</p>
                      <p className="mt-1 text-slate-600">
                        You can manage booking requests and monitor active passenger logs on your "Offered Carpools" panel.
                      </p>
                    </div>
                  );
                }

                // If not driver, check passenger's booking status
                const myBooking = bookings.find((b: any) => b.passengerId === dbUser?.uid);

                if (myBooking && myBooking.status === 'PENDING') {
                  return (
                    <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-sans space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <Clock className="w-4 h-4 animate-pulse" />
                        Booking Request Pending
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        You requested <strong>{myBooking.seatsBooked} seat{myBooking.seatsBooked > 1 ? 's' : ''}</strong>. Fares are settled directly with driver once approved.
                      </p>
                      <div className="pt-1.5 flex flex-col gap-2">
                        <div className="text-[10px] text-slate-400 font-mono">
                          Total Fare: <strong className="text-blue-600">${(parseFloat(ride.fare) * myBooking.seatsBooked).toFixed(2)}</strong>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(myBooking.id)}
                          disabled={bookingLoading}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {bookingLoading ? 'Cancelling...' : 'Withdraw Request'}
                        </button>
                      </div>
                    </div>
                  );
                }

                if (myBooking && myBooking.status === 'CONFIRMED') {
                  return (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-sans space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4" />
                        Booking Confirmed!
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Your seat reservation is confirmed. Please show up on schedule at the pickup point.
                      </p>
                      <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-[11px] text-slate-700 space-y-1.5 font-sans">
                        <div>Seats Booked: <strong>{myBooking.seatsBooked}</strong></div>
                        <div>Amount Due: <strong className="text-blue-600">${(parseFloat(ride.fare) * myBooking.seatsBooked).toFixed(2)}</strong></div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px] pt-1 border-t border-slate-100 mt-2">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          Driver Contact: <span className="text-slate-800 font-bold">{ride.driverPhone || 'No phone listed'}</span>
                        </div>
                      </div>
                      {ride.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCancelBooking(myBooking.id)}
                          disabled={bookingLoading}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {bookingLoading ? 'Cancelling...' : 'Cancel Seat Reservation'}
                        </button>
                      )}
                    </div>
                  );
                }

                if (myBooking && myBooking.status === 'REJECTED') {
                  return (
                    <div className="p-5 bg-rose-50 border border-rose-100 text-rose-950 rounded-2xl text-xs font-sans space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-rose-800">
                        <UserX className="w-4 h-4 text-rose-600" />
                        Request Declined
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Your booking request for this ride was declined by the driver.
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={() => handleCancelBooking(myBooking.id)}
                          disabled={bookingLoading}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Dismiss & Request Again
                        </button>
                      </div>
                    </div>
                  );
                }

                // If cancelled or no booking exists, show the booking form
                if (ride.status !== 'SCHEDULED') {
                  return (
                    <div className="p-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-sans text-center">
                      This ride is no longer scheduling passengers. Status: <strong>{ride.status}</strong>
                    </div>
                  );
                }

                if (ride.seatsAvailable <= 0) {
                  return (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-sans text-center">
                      All seats are fully booked out!
                    </div>
                  );
                }

                return (
                  <form onSubmit={handleBookRide} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Seats Required
                      </label>
                      <select
                        value={bookingSeats}
                        onChange={(e) => setBookingSeats(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      >
                        {[...Array(ride.seatsAvailable)].map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1} Seat{i > 0 ? 's' : ''} (${(parseFloat(ride.fare) * (i + 1)).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                      >
                        {bookingLoading ? 'Reserving Seat...' : 'Request Booking'}
                        <Sparkles className="w-4 h-4 text-white fill-current animate-pulse" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                      By requesting, you agree to show up on schedule at the designated pickup point. Fares are settled directly with the driver.
                    </div>
                  </form>
                );
              })()}

              {/* Passenger Log for Driver */}
              {isDriver && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  
                  {/* 1. Pending Booking Requests Section */}
                  {bookings.filter((b: any) => b.status === 'PENDING').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-amber-600 tracking-wide flex items-center gap-1 font-sans">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Pending Requests ({bookings.filter((b: any) => b.status === 'PENDING').length})
                      </h4>
                      <div className="space-y-3">
                        {bookings.filter((b: any) => b.status === 'PENDING').map((b: any) => (
                          <div key={b.id} className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                                  {b.passengerAvatar ? (
                                    <img referrerPolicy="no-referrer" src={b.passengerAvatar} alt={b.passengerName} className="w-full h-full object-cover" />
                                  ) : (
                                    b.passengerName.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{b.passengerName}</p>
                                  <p className="text-[10px] text-slate-400 font-sans">Contact: {b.passengerPhone || 'Unlisted'}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-sans">
                                  {b.seatsBooked} Seat{b.seatsBooked > 1 ? 's' : ''}
                                </span>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 font-mono">${(parseFloat(ride.fare) * b.seatsBooked).toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptBooking(b.id)}
                                disabled={acceptRejectLoadingId !== null}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {acceptRejectLoadingId === b.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectBooking(b.id)}
                                disabled={acceptRejectLoadingId !== null}
                                className="flex-1 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Confirmed Passengers Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1 font-sans">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Passenger Log ({bookings.filter((b: any) => b.status === 'CONFIRMED').length})
                    </h4>
                    
                    {bookings.filter((b: any) => b.status === 'CONFIRMED').length > 0 ? (
                      <div className="space-y-2.5">
                        {bookings.filter((b: any) => b.status === 'CONFIRMED').map((b: any) => {
                          const isCompleted = ride.status === 'COMPLETED';
                          const alreadyReviewed = passengerReviewSuccess[b.passengerId];
                          return (
                            <div key={b.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                                  {b.passengerAvatar ? (
                                    <img referrerPolicy="no-referrer" src={b.passengerAvatar} alt="Passenger" className="w-full h-full object-cover" />
                                  ) : (
                                    b.passengerName.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{b.passengerName}</p>
                                  <p className="text-[10px] text-slate-400 font-sans">{b.passengerPhone || 'No contact info'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-sans">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {b.seatsBooked} Seat{b.seatsBooked > 1 ? 's' : ''}
                                </span>
                                {isCompleted && (
                                  alreadyReviewed ? (
                                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Rated
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setActiveReviewPassenger(b)}
                                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded transition flex items-center gap-0.5 cursor-pointer shadow-sm"
                                    >
                                      <Star className="w-2.5 h-2.5 fill-current" /> Rate
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic font-sans py-1">No confirmed passengers on this ride yet.</p>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Review Passenger Modal */}
      {activeReviewPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-xl relative">
            <h3 className="text-base font-display font-bold text-slate-900 mb-1">
              Rate Passenger
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Share your carpooling experience with <strong>{activeReviewPassenger.passengerName}</strong>.
            </p>

            <form onSubmit={handlePassengerReviewSubmit} className="space-y-4">
              {/* Star rating selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-sans">
                  Star Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setPassengerRating(starValue)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          starValue <= passengerRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
                  Feedback Comment
                </label>
                <textarea
                  required
                  rows={3}
                  value={passengerComment}
                  onChange={(e) => setPassengerComment(e.target.value)}
                  placeholder="Tell us how the passenger was? (e.g. prompt, friendly, polite)"
                  className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReviewPassenger(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passengerReviewLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {passengerReviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
