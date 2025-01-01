import * as React from "react";
import { Bell } from "lucide-react";
import { Card } from "./card";

interface Notification {
  id: string;
  type: 'meeting_created' | 'user_joined' | 'meeting_completed';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsProps {
  notifications: Notification[];
  onNotificationRead?: (id: string) => void;
}

export function Notifications({ notifications, onNotificationRead }: NotificationsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications?.filter(n => !n.read)?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Card className="absolute left-0 mt-2 w-96 max-h-[80vh] overflow-y-auto shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">התראות</h3>
          </div>
          <div className="divide-y">
            {!notifications || notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                אין התראות חדשות
              </div>
            ) : (
              notifications?.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => {
                    if (!notification.read && onNotificationRead) {
                      onNotificationRead(notification.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString('he-IL')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
