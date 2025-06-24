
import React from 'react';
import type { Issue, BoardColumn, ResolutionStatus, User } from '../types';
import { IssueCard } from './IssueCard';

interface BoardViewProps {
  columns: BoardColumn[];
  onSelectIssue: (issue: Issue) => void;
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void; // For D&D or quick actions
  users: User[];
}

export const BoardView: React.FC<BoardViewProps> = ({ columns, onSelectIssue, onUpdateStatus, users }) => {
  if (!columns || columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <p>No board columns to display. Configure board statuses.</p>
      </div>
    );
  }

  // TODO: Implement Drag and Drop
  // For now, onDragStart, onDragOver, onDrop will be placeholders
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, issueId: string) => {
    e.dataTransfer.setData('issueId', issueId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: ResolutionStatus) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('issueId');
    if (issueId) {
      onUpdateStatus(issueId, targetStatus);
    }
  };


  return (
    <div className="flex space-x-4 h-full overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="bg-slate-100 rounded-lg p-3 w-72 sm:w-80 flex-shrink-0 flex flex-col h-full max-h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{column.title}</h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {column.issues.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 custom-scrollbar">
            {column.issues.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 text-center">No issues in this column.</p>
            ) : (
              column.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onSelectIssue(issue)}
                  onDragStart={(e) => handleDragStart(e, issue.id)}
                  users={users}
                />
              ))
            )}
          </div>
        </div>
      ))}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-500 */
        }
      `}</style>
    </div>
  );
};
