import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface Props {
  projectName: string;
  activeSection: string;
  onSelectSection: (section: string) => void;
  onBack: () => void;
}

const menuItems = ['세부사항', '알림', '버전', '컴포넌트'];

export const ProjectSettingsSidebar: React.FC<Props> = ({
  projectName,
  activeSection,
  onSelectSection,
  onBack,
}) => (
  <aside className="w-64 bg-slate-800 text-white flex flex-col h-full">
    <div className="p-4 border-b border-slate-700">
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white focus:outline-none"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold">프로젝트 설정</span>
      </div>
      <div className="text-sm text-slate-300">{projectName}</div>
    </div>
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {menuItems.map((item) => (
        <button
          key={item}
          onClick={() => onSelectSection(item)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
            activeSection === item
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {item}
        </button>
      ))}
    </nav>
  </aside>
);

export default ProjectSettingsSidebar;
