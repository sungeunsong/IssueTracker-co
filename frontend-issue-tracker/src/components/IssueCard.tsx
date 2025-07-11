import React from "react";
import { Link } from "react-router-dom";
import type { Issue, User, Project } from "../types";
import {
  getStatusNameById,
  getTypeNameById,
  getPriorityNameById,
  getStatusColorById,
  getTypeColorById,
  getPriorityColorById,
  DEFAULT_STATUSES,
  DEFAULT_ISSUE_TYPES,
  DEFAULT_PRIORITIES,
} from "../types";
import { UserAvatarPlaceholderIcon } from "./icons/UserAvatarPlaceholderIcon";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  users: User[];
  project?: Project | null;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onDragStart,
  users,
  project,
}) => {
  const statuses = project?.statuses || DEFAULT_STATUSES;
  const types = project?.types || DEFAULT_ISSUE_TYPES;
  const priorities = project?.priorities || DEFAULT_PRIORITIES;

  const statusName = getStatusNameById(issue.statusId, statuses);
  const typeName = getTypeNameById(issue.typeId, types);
  const priorityName = getPriorityNameById(issue.priorityId, priorities);

  const assignedUser = users.find((u) => u.userid === issue.assignee);

  // 상태 뱃지 색상
  const getStatusBadgeColor = () => {
    switch (statusName) {
      case "할일":
        return "bg-blue-100 text-blue-800";
      case "작업":
        return "bg-blue-100 text-blue-800";
      case "수정 중":
        return "bg-yellow-100 text-yellow-800";
      case "수정 완료":
        return "bg-green-100 text-green-800";
      case "완료":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 우선순위 색상
  const getPriorityIndicator = () => {
    switch (priorityName) {
      case "높음":
      case "긴급":
        return "bg-red-500";
      case "보통":
        return "bg-yellow-500";
      case "낮음":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  // 타입 아이콘
  const getTypeIcon = () => {
    switch (typeName) {
      case "버그":
        return "🐛";
      case "개선":
        return "⚡";
      case "새기능":
        return "✨";
      case "작업":
        return "📋";
      default:
        return "📝";
    }
  };

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      aria-label={`Issue: ${issue.title}`}
    >
      {/* 제목 */}
      {/* 헤더: 타입과 우선순위 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-relaxed">
            {issue.title}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <span className="text-xs font-medium text-gray-600">{typeName}</span>
          {/* <div
            className={`w-2 h-2 rounded-full ${getPriorityIndicator()}`}
            title={`우선순위: ${priorityName}`}
          /> */}
        </div>
      </div>

      {/* 내용 */}
      <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {issue.content}
      </p>

      {/* 하단 정보 */}
      <div className="space-y-3">
        {/* 담당자 정보 */}

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            {assignedUser?.profileImage ? (
              <img
                src={assignedUser.profileImage}
                alt="Assignee"
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <span className="text-xs font-medium text-white">
                {issue.assignee
                  ? assignedUser?.username?.charAt(0).toUpperCase() ||
                    issue.assignee?.charAt(0).toUpperCase()
                  : "미"}
              </span>
            )}
          </div>
          {/* <span className="text-xs text-gray-600">
              {assignedUser?.username || issue.assignee}
            </span> */}
          <span className="text-xs text-gray-600">{issue.issueKey}</span>
        </div>
      </div>
    </div>
  );
};
