import React from "react";
import { Link } from "react-router-dom";
import type { Issue, User } from "../types";
import {
  statusColors,
  issueTypeColors,
  issuePriorityColors,
} from "../types";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  users: User[];
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onDragStart,
  users,
}) => {
  const getPriorityStyles = () => {
    return `border-l-4 ${issuePriorityColors[issue.priority]}`;
  };

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className={`bg-white rounded-md shadow-sm p-3 cursor-pointer hover:shadow-lg transition-shadow duration-150 ${getPriorityStyles()}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      aria-label={`Issue: ${issue.title}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="text-sm font-medium text-slate-800 break-words flex-1 pr-2">
          {issue.title}
        </h3>
        <span
          className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
            issueTypeColors[issue.type] || 'bg-slate-100 text-slate-800 ring-slate-600/20'
          } whitespace-nowrap`}
          style={{ fontSize: "0.65rem" }}
          title={`Type: ${issue.type}`}
        >
          {issue.type}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-1 break-words line-clamp-2">
        {issue.content}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span
          className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
            statusColors[issue.status]
          } bg-opacity-80`}
          style={{ fontSize: "0.65rem" }}
          title={`Status: ${issue.status}`}
        >
          {issue.status}
        </span>
        <div className="flex items-center space-x-1">
          {issue.assignee && (
            <div
              title={`Assigned to: ${
                users.find((u) => u.userid === issue.assignee)?.username ||
                issue.assignee
              }`}
              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"
            >
              <UserAvatarPlaceholderIcon className="w-3 h-3 text-slate-500" />
            </div>
          )}
          <Link
            to={`/issues/${issue.issueKey}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-400 hover:underline"
          >
            {issue.issueKey}
          </Link>
        </div>
      </div>
    </div>
  );
};
