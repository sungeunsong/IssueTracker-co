
import React from 'react';
import { ResolutionStatus } from '../types'; // Import base enum for keys
import type { Issue } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';

// Local definitions updated to include WONT_DO
const statusColorsLocal: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  [ResolutionStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  [ResolutionStatus.RESOLVED]: 'bg-green-100 text-green-800 ring-green-600/20',
  [ResolutionStatus.CLOSED]: 'bg-slate-100 text-slate-800 ring-slate-600/20',
  [ResolutionStatus.WONT_DO]: 'bg-purple-100 text-purple-800 ring-purple-600/20', // Added WONT_DO
};

const statusDisplayNamesLocal: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: "진행 전",
  [ResolutionStatus.IN_PROGRESS]: "진행 중",
  [ResolutionStatus.RESOLVED]: "해결됨",
  [ResolutionStatus.CLOSED]: "종료됨",
  [ResolutionStatus.WONT_DO]: "원치 않음", // Added WONT_DO
};


interface IssueListProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, newStatus: ResolutionStatus) => void;
  onDeleteIssue: (issueId: string) => void;
  onViewIssue: (issue: Issue) => void;
  onEditIssue: (issue: Issue) => void;
  currentPage: number;
  totalIssues: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onUpdateStatus,
  onDeleteIssue,
  onViewIssue,
  onEditIssue,
  currentPage,
  totalIssues,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalIssues / itemsPerPage);

  const handleStatusChange = (issueId: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(issueId, event.target.value as ResolutionStatus);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbersToShow = 5;
    let startPage: number, endPage: number;

    if (totalPages <= pageNumbersToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfPagesToShow = Math.floor(pageNumbersToShow / 2);
      if (currentPage <= halfPagesToShow + 1) {
        startPage = 1;
        endPage = pageNumbersToShow;
      } else if (currentPage + halfPagesToShow >= totalPages) {
        startPage = totalPages - pageNumbersToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - halfPagesToShow;
        endPage = currentPage + halfPagesToShow;
      }
    }
    const pageNumbers = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

    return (
      <nav
        className="mt-6 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6"
        aria-label="Pagination"
      >
        <div className="hidden sm:block">
          <p className="text-sm text-slate-700">
            <span className="font-medium">{totalIssues}</span> 개 중{' '}
            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
            {' - '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalIssues)}</span>
            {' '} 표시 중
          </p>
        </div>
        <div className="flex-1 flex justify-between sm:justify-end items-center">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-opacity"
          >
            이전
          </button>
          <div className="hidden sm:flex sm:items-center sm:space-x-1 mx-2">
            {startPage > 1 && (
                <>
                <button onClick={() => onPageChange(1)} className="relative inline-flex items-center px-3 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-md">1</button>
                {startPage > 2 && <span className="px-2 py-2 text-sm text-slate-500">...</span>}
                </>
            )}
            {pageNumbers.map(num => (
             <button
                key={num}
                onClick={() => onPageChange(num)}
                className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${currentPage === num ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'}`}
                aria-current={currentPage === num ? 'page' : undefined}
             >
                {num}
             </button>
            ))}
            {endPage < totalPages && (
                <>
                {endPage < totalPages -1 && <span className="px-2 py-2 text-sm text-slate-500">...</span>}
                <button onClick={() => onPageChange(totalPages)} className="relative inline-flex items-center px-3 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-md">{totalPages}</button>
                </>
            )}
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalIssues === 0}
            className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-opacity"
          >
            다음
          </button>
        </div>
      </nav>
    );
  };

  if (totalIssues === 0 && issues.length === 0) {
    return (
      <div className="text-center py-10 px-6">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-800">검색 결과가 없거나 아직 등록된 이슈가 없습니다.</h3>
        <p className="mt-1 text-sm text-slate-500">다른 검색어를 사용하거나 "새 이슈 등록" 버튼을 클릭하여 이슈를 추가하세요.</p>
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 table-fixed">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[35%]">
              이슈 설명
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[12%]">
              담당자
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[12%]">
              등록자
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[25%] md:w-[30%]">
              코멘트
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[8%]">
              상태
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[8%]">
              생성일
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[15%]">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {issues.map(issue => (
            <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-normal break-words">
                <button
                  onClick={() => onViewIssue(issue)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium text-left focus:outline-none focus:underline"
                  title="상세 보기"
                >
                  {issue.content}
                </button>
                <div className="text-xs text-slate-500 mt-1">ID: {issue.id.substring(0,8)}...</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                {issue.assignee || <span className="text-slate-400 italic">미지정</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{issue.reporter}</td>
              <td className="px-6 py-4 whitespace-normal break-words text-sm text-slate-600">
                {issue.comment ? (
                    issue.comment.length > 50 ? `${issue.comment.substring(0, 50)}...` : issue.comment
                 ) : (
                    <span className="text-slate-400 italic">없음</span>
                 )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorsLocal[issue.status]}`}
                >
                  {statusDisplayNamesLocal[issue.status]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {new Date(issue.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit'})}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-1">
                  <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e)}
                      className="text-xs rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 pr-7"
                      aria-label={`${issue.content.substring(0,15)} 상태 변경`}
                    >
                      {(Object.keys(ResolutionStatus) as Array<keyof typeof ResolutionStatus>).map(statusKey => (
                        ResolutionStatus[statusKey] ?
                        <option key={statusKey} value={ResolutionStatus[statusKey]}>
                          {statusDisplayNamesLocal[ResolutionStatus[statusKey]]}
                        </option>
                        : null
                      ))}
                  </select>
                  <button
                    onClick={() => onEditIssue(issue)}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    aria-label={`이슈 수정: ${issue.content.substring(0,15)}`}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteIssue(issue.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    aria-label={`이슈 삭제: ${issue.content.substring(0,15)}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
};
