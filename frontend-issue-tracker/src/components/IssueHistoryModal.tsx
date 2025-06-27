import React from 'react';
import { IssueHistoryEntry, User, statusDisplayNames } from '../types';
import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: IssueHistoryEntry[];
  users: User[];
}

export const IssueHistoryModal: React.FC<Props> = ({ isOpen, onClose, history, users }) => {
  const renderEntry = (entry: IssueHistoryEntry, idx: number) => {
    const user = users.find(u => u.userid === entry.userId);
    const formatted = new Date(entry.timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    let actionText = entry.action;
    if (entry.action === 'updated' && entry.fromStatus && entry.toStatus) {
      actionText = `상태 변경: ${statusDisplayNames[entry.fromStatus]} → ${statusDisplayNames[entry.toStatus]}`;
    } else if (entry.action === 'updated' && entry.changes && entry.changes.length > 0) {
      actionText = `updated ${entry.changes.join(', ')}`;
    } else if (entry.action === 'commented') {
      actionText = `commented: ${entry.comment}`;
    }
    return (
      <li key={idx} className="text-sm">
        <span className="font-medium">{user ? user.username : entry.userId}</span>{' '}
        <span className="text-slate-500">{formatted}</span>{' '}
        <span className="ml-1 whitespace-pre-line">{actionText}</span>
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
