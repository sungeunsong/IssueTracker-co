import React from 'react';
import BellIcon from './icons/BellIcon';

interface NotificationIconProps {
  onClick: () => void;
  hasUnread: boolean;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ onClick, hasUnread }) => {
  return (
    <button onClick={onClick} className="relative">
      <BellIcon className="w-6 h-6 text-gray-500" />
      {hasUnread && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
};

export default NotificationIcon;
