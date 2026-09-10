import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { NotificationEntity, RealNotificationType } from '../../types';
import { Bell, Calendar, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface NotificationsMenuProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications({ limit: 15 });
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Silently fail in menu
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // Error handling
    }
  };

  const handleNotificationClick = async (notif: NotificationEntity) => {
    if (notif.is_read === 0) {
      try {
        await api.markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Error handling
      }
    }

    setIsOpen(false);

    if (!onNavigate) return;

    // Smart routing based on notification type and related entity
    if (notif.type.startsWith('interview')) {
      if (role === 'recruiter') {
        onNavigate('recruiter-interviews');
      } else {
        onNavigate('interviews');
      }
    } else if (notif.type === 'application_status' || notif.related_entity_type === 'application') {
      if (role === 'recruiter') {
        onNavigate('applicants');
      } else {
        onNavigate('applications');
      }
    }
  };

  const getIcon = (type: RealNotificationType) => {
    switch (type) {
      case 'interview_scheduled':
      case 'interview_rescheduled':
        return <Calendar className="w-3.5 h-3.5 text-indigo-500" />;
      case 'interview_cancelled':
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'interview_completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'application_status':
        return <FileText className="w-3.5 h-3.5 text-brand-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diff = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-control text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-surface-dark-sidebar animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-card bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-dropdown dark:shadow-dropdown-dark z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 dark:border-surface-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">All caught up</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-surface-dark-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                  <Bell className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={clsx(
                      'p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-surface-dark-hover/70 transition-colors cursor-pointer text-left',
                      item.is_read === 0 && 'bg-brand-50/40 dark:bg-brand-950/30'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-surface-dark-bg flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/50 dark:border-surface-dark-border">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={clsx('text-xs truncate', item.is_read === 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300')}>
                          {item.title}
                        </p>
                        {item.is_read === 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 inline-block">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 text-center border-t border-slate-100 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-bg/50">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Resumio Live In-App Notification Center
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
