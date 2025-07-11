import React from "react";
import type { ViewMode } from "../App";
import type { Project } from "../types";
import { ProjectIcon } from "./icons/ProjectIcon";
import { BoardIcon } from "./icons/BoardIcon";
import { ListIcon } from "./icons/ListIcon";
import { FilterIcon } from "./icons/FilterIcon";
import { PlusCircleIcon } from "./icons/PlusCircleIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

interface SidebarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  isAdmin: boolean;
  adminProjectIds: string[];
  onOpenProjectSettings: (id: string) => void;
  isSidebarOpen: boolean; // 추가
  onToggleSidebar: () => void; // 추가
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  actions?: React.ReactNode;
  isFavorite?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  href,
  actions,
  isFavorite,
}) => {
  const baseClasses =
    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 group";
  const activeClasses = "bg-blue-50 text-blue-700 border border-blue-200";
  const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  const content = (
    <>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {isFavorite && <span className="text-yellow-400">⭐</span>}
      {actions}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`${baseClasses} ${
          isActive ? activeClasses : inactiveClasses
        }`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {content}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSetViewMode,
  projects,
  currentProjectId,
  onSelectProject,
  isAdmin,
  adminProjectIds,
  onOpenProjectSettings,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <aside
      className={`${
        isSidebarOpen ? "w-64" : "w-16"
      } border-r border-gray-200 flex flex-col flex-shrink-0 h-full transition-all duration-200 ease-in-out overflow-hidden`}
      style={{ backgroundColor: "#F5F7FF" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center space-x-3 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AF</span>
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Acra Flux
                </h1>
              </div>
            )}
          </div>

          {/* 사이드바 접기/펴기 버튼 */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        /* Navigation */
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Favorites Section - 비워둠 */}
          <div>
            <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              FAVORITES
            </h2>
            <div className="px-2 py-4 text-sm text-gray-400 text-center">
              즐겨찾기한 프로젝트가 없습니다
            </div>
          </div>

          {/* All Projects Section - 실제 프로젝트 데이터 사용 */}
          <div>
            <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              ALL PROJECTS
            </h2>
            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-2 py-1 text-sm text-gray-400">
                  프로젝트가 없습니다
                </div>
              ) : (
                projects.map((p) => (
                  <NavItem
                    key={p.id}
                    icon={<span className="text-blue-500">📁</span>}
                    label={p.name}
                    isActive={p.id === currentProjectId}
                    onClick={() => onSelectProject(p.id)}
                    actions={
                      (isAdmin || adminProjectIds.includes(p.id)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProjectSettings(p.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="프로젝트 설정"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              TOOLS
            </h2>
            <div className="space-y-1">
              <NavItem
                icon={<span className="text-gray-500">🔍</span>}
                label="내가 저장한 이슈"
                onClick={() => alert("Search clicked")}
              />
              <NavItem
                icon={<span className="text-gray-500">📊</span>}
                label="내가 보고자"
                onClick={() => alert("Reports clicked")}
              />
              <NavItem
                icon={<span className="text-gray-500">⚙️</span>}
                label="모든 이슈"
                onClick={() => alert("All issues clicked")}
              />
              <NavItem
                icon={<span className="text-gray-500">📋</span>}
                label="완료된 이슈"
                onClick={() => alert("Completed issues clicked")}
              />
              {/* <NavItem
                icon={<span className="text-gray-500">🔧</span>}
                label="최근 위키"
                onClick={() => alert("Recent wiki clicked")}
              />
              <NavItem
                icon={<span className="text-gray-500">📝</span>}
                label="최근 이슈"
                onClick={() => alert("Recent issues clicked")}
              /> */}
            </div>
          </div>
        </nav>
      )}
    </aside>
  );
};
