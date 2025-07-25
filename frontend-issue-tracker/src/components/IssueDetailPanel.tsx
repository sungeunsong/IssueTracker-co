import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type {
  Issue,
  User,
  StatusItem,
  TypeItem,
  PriorityItem,
  IssueHistoryEntry,
} from "../types";
import type { ResolutionStatus } from "../types";
import {
  getStatusNameById,
  getTypeNameById,
  getPriorityNameById,
  getStatusColorById,
  getTypeColorById,
} from "../types";
import { PencilIcon } from "./icons/PencilIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { XIcon } from "./icons/XIcon";
import { RichTextViewer } from "./RichTextViewer";
import { MentionTextarea } from "./MentionTextarea";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";

// 애니메이션 키프레임 정의
const panelStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }
`;

// 스타일 태그를 헤드에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = panelStyles;
  if (!document.head.querySelector('style[data-panel-animations]')) {
    styleElement.setAttribute('data-panel-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

interface IssueDetailPanelProps {
  issue: Issue;
  onClose: () => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  users: User[];
  onIssueUpdated: (issue: Issue) => void;
  statuses: (StatusItem | string)[];
  types: (TypeItem | string)[];
  priorities: (PriorityItem | string)[];
  showCustomers?: boolean;
  showComponents?: boolean;
}

const DetailItem: React.FC<{
  label: string;
  value?: string | React.ReactNode;
  className?: string;
  isPreLine?: boolean;
}> = ({ label, value, className, isPreLine }) => (
  <div className={className}>
    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
      {label}
    </dt>
    <dd
      className={`text-sm text-slate-800 break-words ${
        isPreLine ? "whitespace-pre-line" : ""
      }`}
    >
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
  onIssueUpdated,
  statuses,
  types,
  priorities,
  showCustomers = true,
  showComponents = true,
}) => {
  const [newComment, setNewComment] = useState("");
  const [localIssue, setLocalIssue] = useState(issue);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");

  // 애니메이션이 있는 닫기 핸들러
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 시간과 일치
  };

  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  const formattedDate = new Date(issue.createdAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedUpdated = new Date(issue.updatedAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedResolved = issue.resolvedAt
    ? new Date(issue.resolvedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
  const typeName = getTypeNameById(
    issue.typeId || issue.type,
    types as TypeItem[]
  );
  const typeColor = getTypeColorById(
    issue.typeId || issue.type,
    types as TypeItem[]
  );
  const priorityName = getPriorityNameById(
    issue.priorityId || issue.priority,
    priorities as PriorityItem[]
  );

  const renderHistoryEntry = (entry: IssueHistoryEntry, idx: number) => {
    const user = users.find((u) => u.userid === entry.userId);
    const formatted = new Date(entry.timestamp).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let actionLabel = "";
    let detailText = "";
    
    if (entry.action === "created") {
      actionLabel = "이슈 생성";
    } else if (entry.action === "updated" && entry.fromStatus && entry.toStatus) {
      actionLabel = "상태 변경됨";
      detailText = `${entry.fromStatus} → ${entry.toStatus}`;
    } else if (entry.action === "updated") {
      actionLabel = "업데이트됨";
      
      // fieldChanges가 있으면 상세한 변경 정보 표시
      if (entry.fieldChanges && Object.keys(entry.fieldChanges).length > 0) {
        const changeDetails = Object.entries(entry.fieldChanges).map(([field, change]) => {
          const fieldName = getFieldDisplayName(field);
          const fromValue = change.from || "없음";
          const toValue = change.to || "없음";
          return `${fieldName}: ${fromValue} → ${toValue}`;
        });
        detailText = changeDetails.join("\n");
      } else if (entry.changes && entry.changes.length > 0) {
        // 구버전 호환성을 위해 기존 changes 필드도 지원
        detailText = entry.changes.join(", ");
      }
    } else if (entry.action === "commented") {
      actionLabel = "댓글 작성";
      detailText = entry.comment || "";
    } else {
      actionLabel = entry.action;
    }

    return (
      <li key={idx} className="flex space-x-2">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <UserAvatarPlaceholderIcon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-slate-700">
              {user ? user.username : entry.userId}
            </span>
            <span className="text-xs text-slate-600">[{actionLabel}]</span>
          </div>
          <div className="text-xs text-slate-400">{formatted}</div>
          {detailText && (
            <div className="mt-1 text-sm text-slate-800 whitespace-pre-line">
              {detailText}
            </div>
          )}
        </div>
      </li>
    );
  };

  // 필드명을 한국어로 변환하는 헬퍼 함수
  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      title: "제목",
      content: "내용",
      reporter: "보고자",
      assignee: "담당자",
      status: "상태",
      resolution: "해결책",
      type: "유형",
      priority: "우선순위",
      component: "컴포넌트",
      customer: "고객사",
      affectsVersion: "영향받는 버전",
      fixVersion: "수정 버전",
      project: "프로젝트",
    };
    return fieldNames[field] || field;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 백그라운드 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-out" 
        onClick={handleClose}
        style={{
          animation: isClosing ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.3s ease-out forwards'
        }}
      ></div>
      
      {/* 패널 */}
      <aside 
        className="absolute right-0 top-0 w-[48rem] bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10 transition-transform duration-300 ease-out"
        style={{
          animation: isClosing ? 'slideOutRight 0.3s ease-out forwards' : 'slideInRight 0.3s ease-out forwards'
        }}
      >
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h2
          className="text-lg font-semibold text-slate-800 truncate"
          title={issue.title}
        >
          Issue Details
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close detail panel"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-800 mb-1 break-words">
            {issue.title}
          </h3>
          <p className="text-xs text-slate-500">
            <Link
              to={`/issues/${issue.issueKey}`}
              className="hover:underline"
            >
              {issue.issueKey}
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-start">
          <DetailItem
            label="상태"
            value={
              <select
                value={statusName}
                onChange={(e) =>
                  onUpdateStatus(issue.id, e.target.value as ResolutionStatus)
                }
                className={`w-full text-xs p-1.5 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${statusColor} appearance-none text-center font-medium`}
                aria-label="Update issue status"
              >
                {statuses.map((s) => {
                  const statusName = typeof s === 'object' ? s.name : s;
                  const statusValue = typeof s === 'object' ? s.id : s;
                  return (
                    <option
                      key={statusValue}
                      value={statusName}
                      className="bg-white text-slate-800"
                    >
                      {statusName}
                    </option>
                  );
                })}
              </select>
            }
          />
          <DetailItem
            label="유형"
            value={
              <span
                className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  typeColor || "bg-slate-100 text-slate-800 ring-slate-600/20"
                }`}
              >
                {typeName}
              </span>
            }
          />
          <DetailItem label="우선순위" value={priorityName} />
          <DetailItem
            label="등록자"
            value={
              (() => {
                const reporterUser = users.find((u) => u.userid === issue.reporter);
                return (
                  <div className="flex items-center space-x-2">
                    {reporterUser?.profileImage ? (
                      <img
                        src={reporterUser.profileImage}
                        alt="Reporter"
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <UserAvatarPlaceholderIcon className="w-6 h-6 text-gray-400" />
                    )}
                    <span>{reporterUser?.username || issue.reporter}</span>
                  </div>
                );
              })()
            }
          />
          <DetailItem
            label="담당자"
            value={
              issue.assignee ? (
                (() => {
                  const assigneeUser = users.find((u) => u.userid === issue.assignee);
                  return (
                    <div className="flex items-center space-x-2">
                      {assigneeUser?.profileImage ? (
                        <img
                          src={assigneeUser.profileImage}
                          alt="Assignee"
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <UserAvatarPlaceholderIcon className="w-6 h-6 text-gray-400" />
                      )}
                      <span>{assigneeUser?.username || issue.assignee}</span>
                    </div>
                  );
                })()
              ) : undefined
            }
          />
          {showComponents && (
            <DetailItem label="컴포넌트" value={issue.component} />
          )}
          {showCustomers && (
            <DetailItem label="고객사" value={issue.customer} />
          )}
          <DetailItem label="영향을 받는 버전" value={issue.affectsVersion} />
          <DetailItem label="수정 버전" value={issue.fixVersion} />
          <DetailItem label="해결 사유" value={issue.resolution} />
          <DetailItem
            label="생성일시"
            value={formattedDate}
            className="col-span-2"
          />
          <DetailItem
            label="수정일시"
            value={formattedUpdated}
            className="col-span-2"
          />
          {formattedResolved && (
            <DetailItem
              label="해결일시"
              value={formattedResolved}
              className="col-span-2"
            />
          )}
        </div>

        <DetailItem
          label="설명"
          value={<RichTextViewer value={issue.content} />}
          className="pt-2 border-t border-slate-100"
        />
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="space-y-1">
            <dt className="text-sm font-medium text-slate-500">첨부파일</dt>
            <dd className="mt-1 text-sm text-slate-900">
              <ul className="list-disc list-inside space-y-1">
                {issue.attachments.map((a, idx) => (
                  <li key={idx}>
                    <a
                      href={`/uploads/${a.filename}`}
                      className="text-indigo-600 hover:underline"
                      download={a.originalName}
                    >
                      {a.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "comments"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              댓글
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "history"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              기록
            </button>
          </div>

          {activeTab === "comments" && (
            <div className="py-4">
              {localIssue.comments && localIssue.comments.length > 0 && (
                <div className="space-y-4">
                  {localIssue.comments.map((c, idx) => {
                    const user = users.find((u) => u.userid === c.userId);
                    const formatted = new Date(c.createdAt).toLocaleString(
                      "ko-KR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    const parts = c.text.split(/(@\w+)/g);
                    return (
                      <div key={idx} className="flex space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          {user?.profileImage ? (
                            <img src={user.profileImage} alt={user.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserAvatarPlaceholderIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-700">
                              {user ? user.username : c.userId}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatted}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                            {parts.map((p, i) =>
                              p.startsWith("@") ? (
                                <span
                                  key={i}
                                  className="text-indigo-600 font-semibold"
                                >
                                  {p}
                                </span>
                              ) : (
                                <span key={i}>{p}</span>
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4">
                <MentionTextarea
                  value={newComment}
                  onChange={setNewComment}
                  projectId={issue.projectId}
                  placeholder="댓글을 입력하세요... (@를 입력하면 사용자 멘션 가능)"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    if (!newComment.trim()) return;
                    const res = await fetch(
                      `/api/issues/${issue.id}/comments`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: newComment }),
                      }
                    );
                    if (res.ok) {
                      const data: Issue = await res.json();
                      setLocalIssue(data);
                      onIssueUpdated(data);
                      setNewComment("");
                    }
                  }}
                  className="mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  댓글 추가
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="py-4">
              {(localIssue.history || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  No history available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(localIssue.history || [])
                    .filter((entry) => entry.action !== "commented")
                    .map(renderHistoryEntry)}
                </ul>
              )}
            </div>
          )}
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
    </div>
  );
};
