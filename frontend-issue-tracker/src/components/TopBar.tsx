import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import type { ViewMode } from "../App";
import type { ResolutionStatus, StatusItem, TypeItem, PriorityItem } from "../types";
import { SearchIcon } from "./icons/SearchIcon";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";
import { LogoutIcon } from "./icons/LogoutIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

import { User } from "../types";

interface TopBarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: ResolutionStatus | "ALL";
  onStatusFilterChange: (status: ResolutionStatus | "ALL") => void;
  statuses: StatusItem[];
  onAssigneeFilterChange: (assignee: string | "ALL") => void;
  onReporterFilterChange: (reporter: string | "ALL") => void;
  onTypeFilterChange: (type: string | "ALL") => void;
  onPriorityFilterChange: (priority: string | "ALL") => void;
  assigneeFilter: string | "ALL";
  reporterFilter: string | "ALL";
  typeFilter: string | "ALL";
  priorityFilter: string | "ALL";
  users: User[];
  types: TypeItem[];
  priorities: PriorityItem[];
  onCreateIssue: () => void;
  currentUser: User | null;
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
  onAssigneeFilterChange,
  onReporterFilterChange,
  onTypeFilterChange,
  onPriorityFilterChange,
  assigneeFilter,
  reporterFilter,
  typeFilter,
  priorityFilter,
  users,
  types,
  priorities,
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
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative hidden md:block">
            <select
              id="assignee-filter-topbar"
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by assignee"
            >
              <option value="ALL">All Assignees</option>
              {users.map((user) => (
                <option key={user.userid} value={user.userid}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="relative hidden md:block">
            <select
              id="reporter-filter-topbar"
              value={reporterFilter}
              onChange={(e) => onReporterFilterChange(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by reporter"
            >
              <option value="ALL">All Reporters</option>
              {users.map((user) => (
                <option key={user.userid} value={user.userid}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="relative hidden md:block">
            <select
              id="type-filter-topbar"
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by type"
            >
              <option value="ALL">All Types</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative hidden md:block">
            <select
              id="priority-filter-topbar"
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by priority"
            >
              <option value="ALL">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

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
