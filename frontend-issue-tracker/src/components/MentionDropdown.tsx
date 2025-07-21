import React, { useState, useEffect } from "react";

interface User {
  id: string;
  userid: string;
  username: string;
  name: string;
  profileImage?: string;
}

interface MentionDropdownProps {
  users: User[];
  isVisible: boolean;
  position: { x: number; y: number };
  searchTerm: string;
  selectedIndex?: number;
  onSelect: (user: User) => void;
  onClose: () => void;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  isVisible,
  position,
  searchTerm,
  selectedIndex = 0,
  onSelect,
  onClose,
}) => {
  // 키보드 이벤트는 MentionTextarea에서 처리하므로 여기서는 제거

  if (!isVisible) {
    return null;
  }

  // 화면 경계 체크 및 위치 조정
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220), // 드롭다운 너비 + 여유분
    y: position.y + 200 > window.innerHeight 
      ? position.y - 200 // 아래 공간이 부족하면 위로
      : position.y
  };

  if (users.length === 0) {
    return (
      <div
        className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg p-2"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          minWidth: "200px",
        }}
      >
        <div className="text-sm text-gray-500">사용자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        minWidth: "200px",
      }}
    >
      {users.map((user, index) => (
        <div
          key={user.id}
          className={`px-3 py-2 cursor-pointer flex items-center space-x-2 ${
            index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
          onClick={() => onSelect(user)}
        >
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{user.username}</div>
            <div className="text-xs text-gray-500">{user.userid}</div>
          </div>
        </div>
      ))}
    </div>
  );
};