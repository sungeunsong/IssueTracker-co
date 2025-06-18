
import React from 'react';
import { ResolutionStatus } from '../types';
import type { Issue } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface IssueItemProps {
  issue: Issue;
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  onDeleteIssue: (issueId: string) => void;
}

const statusColors: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  [ResolutionStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  [ResolutionStatus.RESOLVED]: 'bg-green-100 text-green-800 ring-green-600/20',
  [ResolutionStatus.CLOSED]: 'bg-slate-100 text-slate-800 ring-slate-600/20',
};

const statusDisplayNames: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: "진행 전",
  [ResolutionStatus.IN_PROGRESS]: "진행 중",
  [ResolutionStatus.RESOLVED]: "해결됨",
  [ResolutionStatus.CLOSED]: "종료됨",
};

export const IssueItem: React.FC<IssueItemProps> = ({ issue, onUpdateStatus, onDeleteIssue }) => {
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(issue.id, event.target.value as ResolutionStatus);
  };

  const formattedDate = new Date(issue.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <h3 className="text-lg font-semibold text-indigo-700 mb-2 sm:mb-0 break-all">
          {issue.content}
        </h3>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${statusColors[issue.status]}`}
        >
          {statusDisplayNames[issue.status]}
        </span>
      </div>
      <div className="text-sm text-slate-600 mb-4 space-y-1">
        <p><span className="font-medium">등록자:</span> {issue.reporter}</p>
        <p><span className="font-medium">생성일:</span> {formattedDate}</p>
        <p><span className="font-medium">ID:</span> <code className="text-xs bg-slate-100 p-1 rounded">{issue.id}</code></p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-grow">
            <label htmlFor={`status-${issue.id}`} className="sr-only">상태 업데이트</label>
            <select
            id={`status-${issue.id}`}
            value={issue.status}
            onChange={handleStatusChange}
            className="block w-full sm:w-auto rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
            >
            {(Object.keys(ResolutionStatus) as Array<keyof typeof ResolutionStatus>).map(statusKey => (
                <option key={statusKey} value={ResolutionStatus[statusKey]}>
                {statusDisplayNames[ResolutionStatus[statusKey]]}
                </option>
            ))}
            </select>
        </div>
        <button
          onClick={() => onDeleteIssue(issue.id)}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
          aria-label={`이슈 삭제: ${issue.content.substring(0,30)}`}
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          삭제
        </button>
      </div>
    </div>
  );
};