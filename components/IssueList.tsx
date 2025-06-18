
import React from 'react';
import { IssueItem } from './IssueItem';
import type { Issue, ResolutionStatus } from '../types';

interface IssueListProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  onDeleteIssue: (issueId: string) => void;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onUpdateStatus, onDeleteIssue }) => {
  if (issues.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-800">아직 이슈가 없습니다!</h3>
        <p className="mt-1 text-sm text-slate-500">위에서 새 이슈를 만들어 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {issues.map(issue => (
        <IssueItem
          key={issue.id}
          issue={issue}
          onUpdateStatus={onUpdateStatus}
          onDeleteIssue={onDeleteIssue}
        />
      ))}
    </div>
  );
};