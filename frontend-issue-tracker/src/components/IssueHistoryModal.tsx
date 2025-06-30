import React from 'react';
import { IssueHistoryEntry, User, statusDisplayNames } from '../types';
import { Modal } from './Modal';
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: IssueHistoryEntry[];
  users: User[];
}

export const IssueHistoryModal: React.FC<Props> = ({ isOpen, onClose, history, users }) => {
  const renderEntry = (entry: IssueHistoryEntry, idx: number) => {
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
      detailText = `${statusDisplayNames[entry.fromStatus] || entry.fromStatus} → ${statusDisplayNames[entry.toStatus] || entry.toStatus}`;
    } else if (entry.action === "updated") {
      actionLabel = "업데이트됨";
      if (entry.changes && entry.changes.length > 0) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="히스토리">
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No history available.</p>
      ) : (
        <ul className="space-y-2">{history.map(renderEntry)}</ul>
      )}
    </Modal>
  );
};
