import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import type { ViewMode } from "../App";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";
import { LogoutIcon } from "./icons/LogoutIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

import { User } from "../types";

interface TopBarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  onCreateIssue: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  onRequestLogout: () => void;
  onRequestRegister: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSetViewMode,
  onCreateIssue,
  currentUser,
  isAdmin,
  onRequestLogout,
  onRequestRegister,
}) => {
  const navItems = [
    { id: "board" as ViewMode, label: "Board" },
    { id: "list" as ViewMode, label: "List" },
  ];

  return (
    <header className="bg-white shadow-sm flex-shrink-0 border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Section: Tabs */}
        <div className="flex items-center space-x-4">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Tabs">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSetViewMode(item.id)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${
                    currentView === item.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }
                `}
                aria-current={currentView === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: User Menu, Admin Controls, Create Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          <Menu as="div" className="relative">
            <Menu.Button className="p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" className="h-6 w-6 rounded-full" />
              ) : (
                <UserAvatarPlaceholderIcon className="h-6 w-6" />
              )}
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-slate-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings/user"
                      className={`${active ? 'bg-indigo-500 text-white' : 'text-slate-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <SettingsIcon className={`w-5 h-5 mr-2 ${active ? 'text-white' : 'text-slate-400'}`} />
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
                      className={`${active ? 'bg-red-500 text-white' : 'text-slate-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <LogoutIcon className={`w-5 h-5 mr-2 ${active ? 'text-white' : 'text-red-400'}`} />
                      로그아웃
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>

          {isAdmin && (
            <button
              type="button"
              onClick={onRequestRegister}
              className="px-3 py-2 text-sm text-white bg-slate-600 hover:bg-slate-700 rounded-md shadow-sm"
            >
              사용자 등록
            </button>
          )}

          <button
            onClick={onCreateIssue}
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            Create
          </button>
        </div>
      </div>
    </header>
  );
};
