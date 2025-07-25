import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProjectSettingsSidebar from './components/ProjectSettingsSidebar';
import ProjectIssueSettings from './components/ProjectIssueSettings';
import ProjectCustomers from './components/ProjectCustomers';
import ProjectDetails from './components/ProjectDetails';
import ProjectPermissions from './components/ProjectPermissions';
import type { User } from './types';

interface LocationState {
  projectName?: string;
}

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectName } = (location.state as LocationState) || {};
  const [activeSection, setActiveSection] = useState('세부사항');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);
      }
    };
    const fetchCurrent = async () => {
      const res = await fetch('/api/current-user', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.userid);
      }
    };
    fetchUsers();
    fetchCurrent();
  }, []);

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
        {activeSection === '세부사항' ? (
          projectId ? (
            <ProjectDetails projectId={projectId} />
          ) : (
            <div>프로젝트 ID가 없습니다.</div>
          )
        ) : activeSection === '고객사' ? (
          projectId ? (
            <ProjectCustomers projectId={projectId} users={users} />
          ) : (
            <div>프로젝트 ID가 없습니다.</div>
          )
        ) : activeSection === '이슈 설정' ? (
          projectId ? (
            <ProjectIssueSettings projectId={projectId} />
          ) : (
            <div>프로젝트 ID가 없습니다.</div>
          )
        ) : activeSection === '권한' ? (
          projectId ? (
            <ProjectPermissions projectId={projectId} users={users} />
          ) : (
            <div>프로젝트 ID가 없습니다.</div>
          )
        ) : (
          <div className="text-slate-500">빈 페이지</div>
        )}
      </main>
    </div>
  );
};

export default ProjectSettingsPage;
