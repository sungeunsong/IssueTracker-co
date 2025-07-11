import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import type { ViewMode } from "../App";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";
import { LogoutIcon } from "./icons/LogoutIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

import NotificationIcon from "./NotificationIcon";
import { User } from "../types";

interface TopBarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  onCreateIssue: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  onRequestLogout: () => void;
  onRequestRegister: () => void;
  onToggleSidebar: () => void;
  user: User | null;
  hasUnreadNotifications: boolean;
  onToggleNotifications: () => void;
  onCreateProject: () => void; // 프로젝트 추가 함수 추가
}

const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSetViewMode,
  onCreateIssue,
  currentUser,
  isAdmin,
  onRequestLogout,
  onRequestRegister,
  onToggleSidebar,
  user,
  hasUnreadNotifications,
  onToggleNotifications,
  onCreateProject,
}) => {
  return (
    <header
      className="shadow-sm flex-shrink-0 border-b border-gray-200"
      style={{ backgroundColor: "#F5F7FF" }}
    >
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left Section: Project Add Button */}
        <div className="flex items-center">
          {/* Project Add Button - 파란색 배경 버튼 */}
          <button
            onClick={onCreateProject}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-150"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-medium">프로젝트 추가</span>
          </button>
        </div>

        {/* Center Section: Search Bar + Create Issue Button */}
        <div className="flex-1 max-w-lg mx-8 flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Create Issue Button - 동그란 파란 버튼 */}
          <button
            onClick={onCreateIssue}
            type="button"
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
            title="이슈 등록"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Right Section: User Registration Button, Notifications, User Menu */}
        <div className="flex items-center space-x-3">
          {/* User Registration Button - 흰 배경에 파란 테두리 */}
          <button
            onClick={onRequestRegister}
            type="button"
            className="inline-flex items-center space-x-2 px-4 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>사용자 등록</span>
          </button>

          {/* Notifications */}
          <NotificationIcon
            onClick={onToggleNotifications}
            hasUnread={hasUnreadNotifications}
          />

          {/* User Menu */}
          <Menu as="div" className="relative z-50">
            <Menu.Button className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                {currentUser?.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings/user"
                      className={`${
                        active ? "bg-blue-500 text-white" : "text-gray-900"
                      } group flex rounded-md items-center w-full px-3 py-2 text-sm`}
                    >
                      <SettingsIcon
                        className={`w-4 h-4 mr-3 ${
                          active ? "text-white" : "text-gray-400"
                        }`}
                      />
                      사용자 설정
                    </Link>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onRequestLogout}
                      className={`${
                        active ? "bg-red-500 text-white" : "text-gray-900"
                      } group flex rounded-md items-center w-full px-3 py-2 text-sm`}
                    >
                      <LogoutIcon
                        className={`w-4 h-4 mr-3 ${
                          active ? "text-white" : "text-red-400"
                        }`}
                      />
                      로그아웃
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
