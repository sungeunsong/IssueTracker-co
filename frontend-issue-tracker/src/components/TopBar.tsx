import React from "react";
import type { ViewMode } from "../App";
import type { ResolutionStatus, StatusItem } from "../types";
import { SearchIcon } from "./icons/SearchIcon";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";
import { GlobeIcon } from "./icons/GlobeIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { LogoutIcon } from "./icons/LogoutIcon";

interface TopBarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: ResolutionStatus | "ALL";
  onStatusFilterChange: (status: ResolutionStatus | "ALL") => void;
  statuses: StatusItem[];
  onCreateIssue: () => void;
  currentUser: string | null;
  isAdmin: boolean;
  onRequestLogout: () => void;
  onRequestRegister: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSetViewMode,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  onCreateIssue,
  currentUser,
  isAdmin,
  onRequestLogout,
  onRequestRegister,
  statuses,
}) => {
  const navItems = [
    { id: "board" as ViewMode, label: "Board" },
    { id: "list" as ViewMode, label: "List" },
  ];

  return (
    <header className="bg-white shadow-sm flex-shrink-0 border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Section: Tabs */}
        <div className="flex items-center space-x-4 min-w-[160px]">
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

        {/* Center Section: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="search"
              name="search"
              id="search-issues-topbar"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow duration-150 shadow-sm hover:shadow"
              placeholder="Search issues..."
              aria-label="Search issues"
            />
          </div>
        </div>

        {/* Right Section: Filter, Icons, Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative hidden md:block">
            <select
              id="status-filter-topbar"
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as ResolutionStatus | "ALL")
              }
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            title="Notifications (placeholder)"
          >
            <GlobeIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onRequestLogout}
            type="button"
            className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
            title="로그아웃"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>

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
            {/* <PlusIcon className="w-4 h-4 mr-1.5 -ml-0.5" /> */}
            Create
          </button>
        </div>
      </div>
    </header>
  );
};
