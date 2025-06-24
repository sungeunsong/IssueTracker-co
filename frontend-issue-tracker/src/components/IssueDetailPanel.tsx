
import React from 'react';
import { Link } from 'react-router-dom';
import type { Issue, User } from '../types';
import { ResolutionStatus, statusDisplayNames, statusColors, IssueType, issueTypeDisplayNames, issueTypeColors } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';

interface IssueDetailPanelProps {
  issue: Issue;
  onClose: () => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  users: User[];
}

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; className?: string; isPreLine?: boolean }> = 
  ({ label, value, className, isPreLine }) => (
  <div className={className}>
    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</dt>
    <dd className={`text-sm text-slate-800 break-words ${isPreLine ? 'whitespace-pre-line' : ''}`}>
      {value || <span className="italic text-slate-400">N/A</span>}
    </dd>
  </div>
);

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({
  issue,
  onClose,
  onEditIssue,
  onDeleteIssue,
  onUpdateStatus,
  users,
}) => {
  const formattedDate = new Date(issue.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 h-full shadow-lg">
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-800 truncate" title={issue.content}>
          Issue Details
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close detail panel"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-800 mb-1 break-words">{issue.content}</h3>
            <p className="text-xs text-slate-500">
              <Link to={`/issues/${issue.issueKey}`} className="hover:underline">
                {issue.issueKey}
              </Link>
            </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-start">
          <DetailItem 
            label="Status"
            value={
              <select
                value={issue.status}
                onChange={(e) => onUpdateStatus(issue.id, e.target.value as ResolutionStatus)}
                className={`w-full text-xs p-1.5 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${statusColors[issue.status]} appearance-none text-center font-medium`}
                aria-label="Update issue status"
              >
                {(Object.keys(ResolutionStatus) as Array<keyof typeof ResolutionStatus>).map(statusKey => (
                  ResolutionStatus[statusKey] ?
                  <option key={statusKey} value={ResolutionStatus[statusKey]} className="bg-white text-slate-800">
                    {statusDisplayNames[ResolutionStatus[statusKey]]}
                  </option>
                   : null
                ))}
              </select>
            }
          />
          <DetailItem 
            label="Type"
            value={
                 <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${issueTypeColors[issue.type]}`}>
                    {issueTypeDisplayNames[issue.type]}
                </span>
            }
          />
          <DetailItem label="Reporter" value={users.find(u => u.userid === issue.reporter)?.username || issue.reporter} />
          <DetailItem label="Assignee" value={issue.assignee ? (users.find(u => u.userid === issue.assignee)?.username || issue.assignee) : undefined} />
          <DetailItem label="Affects Version" value={issue.affectsVersion} />
          <DetailItem label="Fix Version" value={issue.fixVersion} />
          <DetailItem label="Created At" value={formattedDate} className="col-span-2"/>
        </div>
        
        <DetailItem label="Description" value={issue.content} isPreLine={true} className="pt-2 border-t border-slate-100" />
        <DetailItem label="Comments" value={issue.comment || "No comments yet."} isPreLine={true}/>

        <div className="mt-4 pt-4 border-t border-slate-100">
            <textarea 
                className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
                placeholder="Add a comment... (UI only)"
            />
            <button className="mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
                Add Comment
            </button>
        </div>
      </div>
      
      <div className="px-4 py-3 border-t border-slate-200 flex-shrink-0 flex items-center justify-end space-x-2">
        <button
          onClick={() => onDeleteIssue(issue.id)}
          className="px-3 py-1.5 text-xs font-medium rounded-md text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-colors flex items-center"
        >
          <TrashIcon className="w-3.5 h-3.5 mr-1" /> Delete
        </button>
        <button
          onClick={() => onEditIssue(issue)}
          className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent shadow-sm transition-colors flex items-center"
        >
          <PencilIcon className="w-3.5 h-3.5 mr-1" /> Edit
        </button>
      </div>
    </aside>
  );
};
