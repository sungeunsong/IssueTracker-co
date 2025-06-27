
import React from 'react';
import type { Issue, User } from '../types';
import { statusDisplayNames, statusColors } from '../types';
import { RichTextViewer } from './RichTextViewer';

interface IssueDetailsViewProps {
  issue: Issue;
  users?: User[];
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

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({ issue, users }) => {
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
              className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusColors[issue.status]}`}
            >
              {statusDisplayNames[issue.status]}
            </span>
          </dd>
        </div>
        <DetailItem label="생성일시" value={formattedDate} />
        <DetailItem label="수정일시" value={formattedUpdated} />
        {formattedResolved && <DetailItem label="해결일시" value={formattedResolved} />}
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