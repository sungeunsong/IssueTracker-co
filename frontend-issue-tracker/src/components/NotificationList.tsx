import React from 'react';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
  notifications: Notification[];
  onClose: () => void;
  onRead: (id: string) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onClose, onRead }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    onRead(notification.id);
    navigate(`/issues/${notification.issueKey}`);
    onClose();
  };

  return (
    <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg border z-50">
      <div className="p-4 border-b">
        <h3 className="font-semibold">알림</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500">새로운 알림이 없습니다.</p>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
