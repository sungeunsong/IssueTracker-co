import React from "react";
import type { ResolutionStatus, StatusItem, TypeItem, PriorityItem, User } from "../types";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface FilterBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: ResolutionStatus | "ALL";
  onStatusFilterChange: (status: ResolutionStatus | "ALL") => void;
  statuses: StatusItem[];
  assigneeFilter: string | "ALL";
  onAssigneeFilterChange: (assignee: string | "ALL") => void;
  reporterFilter: string | "ALL";
  onReporterFilterChange: (reporter: string | "ALL") => void;
  typeFilter: string | "ALL";
  onTypeFilterChange: (type: string | "ALL") => void;
  priorityFilter: string | "ALL";
  onPriorityFilterChange: (priority: string | "ALL") => void;
  users: User[];
  types: TypeItem[];
  priorities: PriorityItem[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  statuses,
  assigneeFilter,
  onAssigneeFilterChange,
  reporterFilter,
  onReporterFilterChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  users,
  types,
  priorities,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <input
              type="search"
              placeholder="이슈 검색..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as ResolutionStatus | "ALL")}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[120px]"
            >
              <option value="ALL">전체 상태</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Assignee Filter */}
          <div className="relative">
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[120px]"
            >
              <option value="ALL">전체 담당자</option>
              {users.map((user) => (
                <option key={user.userid} value={user.userid}>
                  {user.username}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Reporter Filter */}
          <div className="relative">
            <select
              value={reporterFilter}
              onChange={(e) => onReporterFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[120px]"
            >
              <option value="ALL">전체 보고자</option>
              {users.map((user) => (
                <option key={user.userid} value={user.userid}>
                  {user.username}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[120px]"
            >
              <option value="ALL">전체 유형</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[120px]"
            >
              <option value="ALL">전체 우선순위</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              onSearchTermChange("");
              onStatusFilterChange("ALL");
              onAssigneeFilterChange("ALL");
              onReporterFilterChange("ALL");
              onTypeFilterChange("ALL");
              onPriorityFilterChange("ALL");
            }}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
};