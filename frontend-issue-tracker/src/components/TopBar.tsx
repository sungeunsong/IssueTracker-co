
import React from 'react';
import type { ViewMode } from '../App';
import { ResolutionStatus, statusDisplayNames } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { UserAvatarPlaceholderIcon } from './icons/UserAvatarPlaceholderIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { PlusIcon } from './icons/PlusIcon';

interface TopBarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: ResolutionStatus | 'ALL';
  onStatusFilterChange: (status: ResolutionStatus | 'ALL') => void;
  onCreateIssue: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSetViewMode,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  onCreateIssue,
}) => {
  const navItems = [
    { id: 'board' as ViewMode, label: 'Board' },
    { id: 'list' as ViewMode, label: 'List' },
  ];

  return (
    <header className="bg-white shadow-sm flex-shrink-0 border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Section: Tabs and View Name */}
        <div className="flex items-center">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Tabs">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSetViewMode(item.id)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${currentView === item.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }
                `}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: Search, Filters, Actions, User */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
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
          
          {/* Status Filter Dropdown - simplified, consider a dedicated filter button for more complex filters */}
          <div className="relative hidden md:block">
            <select
              id="status-filter-topbar"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as ResolutionStatus | 'ALL')}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 hover:shadow"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              {(Object.keys(ResolutionStatus) as Array<keyof typeof ResolutionStatus>).map(key => (
                  ResolutionStatus[key] ?
                  <option key={key} value={ResolutionStatus[key]}>
                    {statusDisplayNames[ResolutionStatus[key]]}
                  </option>
                  : null
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
            type="button"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            title="User (placeholder)"
          >
            <UserAvatarPlaceholderIcon className="h-6 w-6 rounded-full" />
          </button>

          <button
            onClick={onCreateIssue}
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            <PlusIcon className="w-4 h-4 mr-1.5 -ml-0.5" />
            Create
          </button>
        </div>
      </div>
    </header>
  );
};
