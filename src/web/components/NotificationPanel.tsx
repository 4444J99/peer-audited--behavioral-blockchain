'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../services/api-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const [notifs, countData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors relative"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-black text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-bold text-sm uppercase tracking-widest text-neutral-400">Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-neutral-600 text-sm">No notifications yet.</div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`w-full text-left p-4 border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors ${
                    !n.read ? 'bg-neutral-800/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                    )}
                    <div className={!n.read ? '' : 'ml-5'}>
                      <p className="font-bold text-sm text-white">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-neutral-500 mt-1">{n.body}</p>
                      )}
                      <p className="text-[10px] text-neutral-600 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
