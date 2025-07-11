import React from "react";
import type {
  Issue,
  BoardColumn,
  ResolutionStatus,
  User,
  Project,
} from "../types";
import { IssueCard } from "./IssueCard";

interface BoardViewProps {
  columns: BoardColumn[];
  onSelectIssue: (issue: Issue) => void;
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  users: User[];
  project?: Project | null;
}

export const BoardView: React.FC<BoardViewProps> = ({
  columns,
  onSelectIssue,
  onUpdateStatus,
  users,
  project,
}) => {
  if (!columns || columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <p>No board columns to display. Configure board statuses.</p>
      </div>
    );
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issueId: string
  ) => {
    e.dataTransfer.setData("issueId", issueId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: ResolutionStatus
  ) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("issueId");
    if (issueId) {
      onUpdateStatus(issueId, targetStatus);
    }
  };

  // 컬럼별 배경색 설정
  const getColumnBackgroundColor = (columnTitle: string) => {
    switch (columnTitle) {
      case "할일":
        return "bg-blue-50";
      case "수정 중":
        return "bg-yellow-50";
      case "수정 완료":
        return "bg-green-50";
      case "검증":
        return "bg-purple-50";
      case "완료":
        return "bg-gray-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="w-full h-full bg-white">
      <div className="overflow-hidden bg-white flex-1">
        {/* 상태별 컬럼 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 h-full">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${getColumnBackgroundColor(
                column.title
              )} rounded-lg border border-gray-200 flex flex-col h-full max-h-[calc(100vh-280px)]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* 컬럼 헤더 - 고정 */}
              <div className="flex items-center justify-between p-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {column.issues.length}
                    </span>
                  </div>
                </div>

                {/* 상태별 색상 표시 */}
                <div className="flex items-center space-x-2">
                  {column.title === "할일" && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                  {column.title === "수정 중" && (
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  )}
                  {column.title === "수정 완료" && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                  {column.title === "검증" && (
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  )}
                  {column.title === "완료" && (
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* 이슈 카드들 - 스크롤 가능 영역 */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                {column.issues.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">📝</span>
                    </div>
                    <p className="text-sm">이슈가 없습니다</p>
                  </div>
                ) : (
                  column.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => onSelectIssue(issue)}
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      users={users}
                      project={project}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 모든 컬럼이 비어있을 때 */}
        {columns.every((column) => column.issues.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              이슈가 없습니다
            </p>
            <p className="text-gray-600">새로운 이슈를 생성해보세요.</p>
          </div>
        )}
      </div>

      {/* 커스텀 스크롤바 스타일 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
    </div>
  );
};
