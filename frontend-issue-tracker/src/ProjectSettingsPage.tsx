import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProjectSettingsSidebar from './components/ProjectSettingsSidebar';

interface LocationState {
  projectName?: string;
}

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectName } = (location.state as LocationState) || {};
  const [activeSection, setActiveSection] = useState('세부사항');

  return (
    <div className="flex h-screen bg-white text-slate-800">
      <ProjectSettingsSidebar
        projectName={projectName || projectId || ''}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onBack={() => navigate('/')}
      />
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">{activeSection}</h2>
        <div className="text-slate-500">빈 페이지</div>
      </main>
    </div>
  );
};

export default ProjectSettingsPage;
