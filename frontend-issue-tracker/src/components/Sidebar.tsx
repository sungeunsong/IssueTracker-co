
import React from 'react';
import type { ViewMode } from '../App';
import type { Project } from '../types';
import { ProjectIcon } from './icons/ProjectIcon';
import { BoardIcon } from './icons/BoardIcon';
import { ListIcon } from './icons/ListIcon';
import { FilterIcon } from './icons/FilterIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface SidebarProps {
  currentView: ViewMode;
  onSetViewMode: (viewMode: ViewMode) => void;
  onCreateProject: () => void;
  projects: Project[];
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string; // For potential future actual navigation
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, href }) => {
  const baseClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150";
  const activeClasses = "bg-slate-700 text-white";
  const inactiveClasses = "text-slate-300 hover:bg-slate-700 hover:text-white";

  const content = (
    <>
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
        {content}
      </a>
    );
  }

  return (
    <div onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.()}}
    >
      {content}
    </div>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSetViewMode, onCreateProject, projects }) => {
  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col flex-shrink-0 h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500 p-2 rounded-md">
            <ProjectIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold">{projects[0]?.name || 'No Project'}</h1>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="mb-3">
            <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recent</h2>
            <NavItem icon={<BoardIcon />} label="Board" isActive={currentView === 'board'} onClick={() => onSetViewMode('board')} />
            <NavItem icon={<ListIcon />} label="Issues" isActive={currentView === 'list'} onClick={() => onSetViewMode('list')} />
        </div>
        
        <div className="mb-3">
            <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">All Projects</h2>
            {projects.length === 0 && (
              <div className="px-3 py-1 text-sm text-slate-400">No projects</div>
            )}
            {projects.map((p) => (
              <NavItem key={p.id} icon={<ProjectIcon className="opacity-50" />} label={p.name} />
            ))}
        </div>

        <div>
            <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tools</h2>
            <NavItem icon={<FilterIcon />} label="Filters" onClick={() => alert("Filters (placeholder)")}/>
            {/* <NavItem icon={<UserIcon />} label="My Issues" /> Placeholder for user-specific views */}
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-slate-700">
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors duration-150 text-slate-200 hover:text-white"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Create project</span>
        </button>
      </div>
    </aside>
  );
};
