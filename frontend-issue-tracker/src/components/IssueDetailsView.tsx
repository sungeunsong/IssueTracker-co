
import React from 'react';
import type {
  Issue,
  User,
  StatusItem,
  TypeItem,
  PriorityItem,
} from '../types';
import {
  getStatusNameById,
  getStatusColorById,
  getTypeNameById,
  getPriorityNameById,
  getTypeColorById,
  getPriorityColorById,
  DEFAULT_STATUSES,
  DEFAULT_ISSUE_TYPES,
  DEFAULT_PRIORITIES,
} from '../types';
import { RichTextViewer } from './RichTextViewer';

interface IssueDetailsViewProps {
  issue: Issue;
  users?: User[];
  statuses?: (StatusItem | string)[];
  types?: (TypeItem | string)[];
  priorities?: (PriorityItem | string)[];
  showCustomers?: boolean;
  showComponents?: boolean;
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

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({
  issue,
  users,
  statuses = DEFAULT_STATUSES,
  types = DEFAULT_ISSUE_TYPES,
  priorities = DEFAULT_PRIORITIES,
  showCustomers = true,
  showComponents = true,
}) => {
  const formattedDate = new Date(issue.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedUpdated = new Date(issue.updatedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedResolved = issue.resolvedAt
    ? new Date(issue.resolvedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const statusName = getStatusNameById(
    issue.statusId || issue.status,
    statuses as StatusItem[]
  );
  const statusColor = getStatusColorById(
    issue.statusId || issue.status,
    statuses as StatusItem[]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{issue.title}</h2>
      <dl className="space-y-4">
        <DetailItem
          label="이슈 설명"
          value={<RichTextViewer value={issue.content} />}
        />
        <DetailItem label="등록자" value={users?.find(u => u.userid === issue.reporter)?.username || issue.reporter} />
        <DetailItem label="담당자" value={issue.assignee ? (users?.find(u => u.userid === issue.assignee)?.username || issue.assignee) : undefined} />
        {showComponents && (
          <DetailItem label="컴포넌트" value={issue.component} />
        )}
        {showCustomers && (
          <DetailItem label="고객사" value={issue.customer} />
        )}
        {issue.affectsVersion && (
          <DetailItem label="영향을 받는 버전" value={issue.affectsVersion} />
        )}
        {issue.fixVersion && (
          <DetailItem label="수정 버전" value={issue.fixVersion} />
        )}
        {issue.comments && issue.comments.length > 0 && (
          <div>
            <dt className="text-sm font-medium text-slate-500">코멘트</dt>
            <dd className="mt-1 space-y-3">
              {issue.comments.map((c, idx) => {
                const user = users?.find((u) => u.userid === c.userId);
                const parts = c.text.split(/(@\w+)/g);
                const formatted = new Date(c.createdAt).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={idx} className="text-sm">
                    <p className="font-medium">
                      {user ? user.username : c.userId}
                      <span className="ml-2 text-xs text-slate-400">{formatted}</span>
                    </p>
                    <p className="whitespace-pre-wrap">
                      {parts.map((p, i) =>
                        p.startsWith("@") ? (
                          <span key={i} className="text-indigo-600 font-semibold">
                            {p}
                          </span>
                        ) : (
                          <span key={i}>{p}</span>
                        )
                      )}
                    </p>
                  </div>
                );
              })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-sm font-medium text-slate-500">상태</dt>
          <dd className="mt-1">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusColor}`}
            >
              {statusName}
            </span>
          </dd>
        </div>
        <DetailItem label="생성일시" value={formattedDate} />
        <DetailItem label="수정일시" value={formattedUpdated} />
        {formattedResolved && <DetailItem label="해결일시" value={formattedResolved} />}
        {issue.resolution && <DetailItem label="해결 사유" value={issue.resolution} />}
        {issue.attachments && issue.attachments.length > 0 && (
          <DetailItem
            label="첨부 파일"
            value={
              <ul className="list-disc list-inside space-y-1">
                {issue.attachments.map((a, idx) => (
                  <li key={idx}>
                    <a
                      href={`/uploads/${a.filename}`}
                      download={a.originalName}
                      className="text-indigo-600 hover:underline"
                    >
                      {a.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            }
          />
        )}
        <DetailItem label="이슈 키" value={issue.issueKey} isCode />
        <DetailItem label="고유 ID" value={issue.id} isCode />
      </dl>
    </div>
  );
};