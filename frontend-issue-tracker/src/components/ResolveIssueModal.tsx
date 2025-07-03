import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { User, Version, ResolutionItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    assignee?: string;
    resolution: string;
    fixVersion?: string;
    attachments: File[];
    comment?: string;
  }) => void;
  projectId: string;
  users: User[];
  resolutions: (ResolutionItem | string)[];
  initialAssignee?: string;
}

export const ResolveIssueModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  users,
  resolutions,
  initialAssignee,
}) => {
  const [assignee, setAssignee] = useState(initialAssignee || '');
  const [resolution, setResolution] = useState(resolutions[0] || '');
  const [fixVersion, setFixVersion] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [comment, setComment] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}/versions`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setVersions(data as Version[]))
        .catch(() => setVersions([]));
    }
  }, [projectId]);

  useEffect(() => {
    setAssignee(initialAssignee || '');
  }, [initialAssignee]);

  useEffect(() => {
    if (resolutions && resolutions.length > 0) {
      const firstResolution = resolutions[0];
      const resolutionName = typeof firstResolution === 'object' ? firstResolution.name : firstResolution;
      setResolution(resolutionName);
    }
  }, [resolutions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ assignee, resolution, fixVersion, attachments, comment });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="수정 완료 정보">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="resolve-assignee">
            담당자
          </label>
          <select
            id="resolve-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
          >
            <option value="">미지정</option>
            {users.map((u) => (
              <option key={u.userid} value={u.userid}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="resolve-reason">
            해결 사유
          </label>
          <select
            id="resolve-reason"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            required
          >
            {resolutions.map((r) => {
              const resolutionName = typeof r === 'object' ? r.name : r;
              const resolutionValue = typeof r === 'object' ? r.id : r;
              return (
                <option key={resolutionValue} value={resolutionName}>
                  {resolutionName}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="resolve-fixVersion">
            수정 버전
          </label>
          <select
            id="resolve-fixVersion"
            value={fixVersion}
            onChange={(e) => setFixVersion(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
          >
            <option value="">선택 없음</option>
            {versions.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="resolve-files">
            첨부 파일
          </label>
          <input
            id="resolve-files"
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
            className="mt-1 block w-full text-sm text-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="resolve-comment">
            댓글
          </label>
          <textarea
            id="resolve-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md"
          >
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResolveIssueModal;
