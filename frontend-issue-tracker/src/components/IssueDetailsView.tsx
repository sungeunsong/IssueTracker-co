
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
} from '../types';
import { RichTextViewer } from './RichTextViewer';
import { UserAvatarPlaceholderIcon } from './icons/UserAvatarPlaceholderIcon';

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
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
    <dt className="text-sm font-medium text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 break-words">
      {value || <span className="italic text-slate-400">정보 없음</span>}
    </dd>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg">
    <div className="px-4 py-5 sm:px-6">
      <h3 className="text-lg font-medium leading-6 text-slate-900">{title}</h3>
    </div>
    <div className="border-t border-slate-200 px-4 py-5 sm:px-6">
      {children}
    </div>
  </div>
);

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({
  issue,
  users = [],
  statuses = [],
  types = [],
  priorities = [],
  showCustomers = true,
  showComponents = true,
}) => {
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusName = getStatusNameById(issue.statusId || issue.status, statuses as StatusItem[]);
  const statusColor = getStatusColorById(issue.statusId || issue.status, statuses as StatusItem[]);
  const typeName = getTypeNameById(issue.typeId || issue.type, types as TypeItem[]);
  const priorityName = getPriorityNameById(issue.priorityId || issue.priority, priorities as PriorityItem[]);
  
  // 사용자 정보 조회 헬퍼 함수
  const getReporterUser = () => users.find(u => u.userid === issue.reporter);
  const getAssigneeUser = () => issue.assignee ? users.find(u => u.userid === issue.assignee) : null;
  
  // 사용자 표시 컴포넌트 헬퍼 함수
  const renderUserWithAvatar = (user: any, defaultId: string) => (
    <div className="flex items-center space-x-2">
      {user?.profileImage ? (
        <img
          src={user.profileImage}
          alt="User"
          className="w-6 h-6 rounded-full"
        />
      ) : (
        <UserAvatarPlaceholderIcon className="w-6 h-6 text-gray-400" />
      )}
      <span>{user?.username || defaultId}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        <Card title="이슈 설명">
          <RichTextViewer value={issue.content} />
        </Card>

        {issue.attachments && issue.attachments.length > 0 && (
          <Card title="첨부 파일">
            <ul className="list-disc list-inside space-y-2">
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
          </Card>
        )}

        {issue.comments && issue.comments.length > 0 && (
          <Card title="코멘트">
            <div className="space-y-4">
              {issue.comments.map((c, idx) => {
                const user = users.find((u) => u.userid === c.userId);
                const parts = c.text.split(/(@\w+)/g);
                const formattedDate = formatDate(c.createdAt);
                return (
                  <div key={idx} className="text-sm p-3 bg-slate-50 rounded-md">
                    <p className="font-medium text-slate-800">
                      {user ? user.username : c.userId}
                      <span className="ml-2 text-xs font-normal text-slate-400">{formattedDate}</span>
                    </p>
                    <div className="mt-1 text-slate-700 whitespace-pre-wrap">
                      {parts.map((p, i) =>
                        p.startsWith("@") ? (
                          <span key={i} className="text-indigo-600 font-semibold">{p}</span>
                        ) : (
                          <span key={i}>{p}</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Sidebar with details */}
      <div className="space-y-6">
        <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-slate-900">세부 정보</h3>
          </div>
          <div className="border-t border-slate-200">
            <dl className="divide-y divide-slate-200">
              <DetailItem 
                label="상태" 
                value={
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusColor}`}>
                    {statusName}
                  </span>
                } 
              />
              <DetailItem 
                label="담당자" 
                value={issue.assignee ? renderUserWithAvatar(getAssigneeUser(), issue.assignee) : undefined} 
              />
              <DetailItem 
                label="등록자" 
                value={renderUserWithAvatar(getReporterUser(), issue.reporter)} 
              />
              <DetailItem label="업무 유형" value={typeName} />
              <DetailItem label="우선순위" value={priorityName} />
              {showComponents && <DetailItem label="컴포넌트" value={issue.component} />}
              {showCustomers && <DetailItem label="고객사" value={issue.customer} />}
              {issue.affectsVersion && <DetailItem label="영향 버전" value={issue.affectsVersion} />}
              {issue.fixVersion && <DetailItem label="수정 버전" value={issue.fixVersion} />}
              <DetailItem label="생성일시" value={formatDate(issue.createdAt)} />
              <DetailItem label="수정일시" value={formatDate(issue.updatedAt)} />
              {issue.resolvedAt && <DetailItem label="해결일시" value={formatDate(issue.resolvedAt)} />}
              {issue.resolution && <DetailItem label="해결 사유" value={issue.resolution} />}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};