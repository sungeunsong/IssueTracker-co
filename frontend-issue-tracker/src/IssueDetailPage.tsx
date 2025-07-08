import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { IssueWithProject, Project, User } from './types';
import { IssueDetailsView } from './components/IssueDetailsView';
import { IssueForm } from './components/IssueForm';
import { Modal } from './components/Modal';
import type { IssueFormData } from './App';

export const IssueDetailPage: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const [issue, setIssue] = useState<IssueWithProject | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      const res = await fetch(`/api/issuesWithProject/key/${issueKey}`);
      if (res.ok) {
        const data: IssueWithProject = await res.json();
        setIssue(data);
        const projRes = await fetch(`/api/projects/${data.projectId}`);
        if (projRes.ok) {
          const proj: Project = await projRes.json();
          setProject(proj);
        }
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
          const us: User[] = await userRes.json();
          setUsers(us);
        }
      } else {
        const err = await res
          .json()
          .catch(() => ({ message: '이슈를 불러올 수 없습니다.' }));
        setError(err.message || '이슈를 불러올 수 없습니다.');
      }
    };
    fetchIssue();
  }, [issueKey]);

  const handleEditIssue = async (formData: IssueFormData) => {
    if (!issue) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { attachments, ...rest } = formData;
      const body = new FormData();
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null) body.append(k, String(v));
      });
      (attachments || []).forEach((f) => body.append('files', f));
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: 'PUT',
        body,
      });
      if (res.ok) {
        const updated: IssueWithProject = await res.json();
        setIssue(updated);
        setShowEdit(false);
      } else {
        const err = await res.json().catch(() => ({ message: '이슈 수정 실패' }));
        setError(err.message || '이슈 수정 실패');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Link to="/" className="text-indigo-600 hover:underline">← Back</Link>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-6">Loading...</div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="mb-4">
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              &larr; 모든 이슈 보기
            </Link>
          </div>
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {issue.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{issue.issueKey}</p>
            </div>
            <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                이슈 수정
              </button>
            </div>
          </div>
        </div>

        <IssueDetailsView
          issue={issue}
          users={users}
          statuses={project?.statuses || []}
          types={project?.types || []}
          priorities={project?.priorities || []}
          showCustomers={issue.showCustomers}
          showComponents={issue.showComponents}
        />
        
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="이슈 수정">
          {project && (
            <IssueForm
              onSubmit={handleEditIssue}
              initialData={issue}
              onCancel={() => setShowEdit(false)}
              isSubmitting={isSubmitting}
              submitButtonText="변경사항 저장"
              isEditMode={true}
              projects={[project]}
              selectedProjectId={project.id}
              users={users}
              currentUserId={issue.reporter}
              currentUserName={users.find(u => u.userid === issue.reporter)?.username || ''}
              statuses={project.statuses || []}
              priorities={project.priorities || []}
              types={project.types || []}
              components={project.components || []}
              customers={project.customers || []}
              showCustomers={project.showCustomers}
              showComponents={project.showComponents}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default IssueDetailPage;
