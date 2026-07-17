import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckCircle, ArrowLeft, Trash2, MailOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotificationsList(data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update
        setNotificationsList(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const unread = notificationsList.filter(n => !n.isRead);
      for (const n of unread) {
        await fetch(`/api/notifications/${n.id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
      // Refresh list
      await fetchNotifications();
    } catch (err) {
      console.error('Error reading all:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Nav Back */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              My Alerts
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Stay synchronized with booking approvals, trip updates, or driving reviews.
            </p>
          </div>
          {notificationsList.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <MailOpen className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-3">Compiling alert channels...</p>
          </div>
        ) : notificationsList.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {notificationsList.map((notif, index) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`p-5 flex gap-4 transition items-start ${
                  notif.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-blue-50/30 hover:bg-blue-50/50 cursor-pointer'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  notif.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`text-sm font-sans ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-950'}`}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center">
            <Bell className="w-12 h-12 text-slate-300" />
            <h3 className="text-lg font-display font-bold mt-4 text-slate-900">No Alerts Listed</h3>
            <p className="text-slate-500 text-xs mt-1.5 font-sans max-w-sm leading-relaxed text-center">
              Your alert logs are completely empty. Once booking requests are processed, they will appear here.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
