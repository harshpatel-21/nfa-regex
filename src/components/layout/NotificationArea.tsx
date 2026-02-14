import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { setNotificationHandler } from '../../utils/notify';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export function NotificationArea() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotificationHandler((n) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [...prev, { ...n, id }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(p => p.id !== id));
      }, 4000);
    });
    return () => {
      setNotificationHandler(null);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
              n.type === 'success'
                ? 'bg-green-600 text-white'
                : n.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-white'
            }`}
          >
            {n.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
