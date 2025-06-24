
import React from 'react';
import type { Issue } from '../types';
import { statusDisplayNames, statusColors } from '../types';

interface IssueDetailsViewProps {
  issue: Issue;
}

interface DetailItemProps {
  label: string;
  value?: string | React.ReactNode;
  isCode?: boolean;
  isPreLine?: boolean; // For preserving line breaks
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isCode, isPreLine }) => (
  <div>
    <dt className="text-sm font-medium text-slate-500">{label}</dt>
    {isCode ? (
      <dd className="mt-1 text-sm text-slate-900 bg-slate-50 p-2 rounded overflow-x-auto"><code className="whitespace-pre-wrap break-all">{value || '-'}</code></dd>
    ) : (
      <dd className={`mt-1 text-sm text-slate-900 break-words ${isPreLine ? 'whitespace-pre-line' : ''}`}>{value || <span className="italic text-slate-400">정보 없음</span>}</dd>
    )}
  </div>
);

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({ issue }) => {
  const formattedDate = new Date(issue.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        <DetailItem label="이슈 설명" value={issue.content} isPreLine={true} />
        <DetailItem label="등록자" value={issue.reporter} />
        <DetailItem label="담당자" value={issue.assignee || undefined} />
        <DetailItem label="코멘트" value={issue.comment || undefined} isPreLine={true} />
        <div>
          <dt className="text-sm font-medium text-slate-500">상태</dt>
          <dd className="mt-1">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusColors[issue.status]}`}
            >
              {statusDisplayNames[issue.status]}
            </span>
          </dd>
        </div>
        <DetailItem label="생성일시" value={formattedDate} />
        <DetailItem label="이슈 키" value={issue.issueKey} isCode />
        <DetailItem label="고유 ID" value={issue.id} isCode />
      </dl>
    </div>
  );
};