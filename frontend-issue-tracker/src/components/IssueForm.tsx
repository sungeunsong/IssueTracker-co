
import React, { useState, useEffect } from 'react';
import type { Issue, ResolutionStatus as StatusEnum } from '../types';
import { ResolutionStatus, statusDisplayNames } from '../types'; // Keep for enum values
import { PlusIcon } from './icons/PlusIcon';
import type { IssueFormData } from '../App'; // Import shared form data type

interface IssueFormProps {
  onSubmit: (formData: IssueFormData) => Promise<void>;
  initialData?: Partial<Issue>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  isEditMode?: boolean;
}

export const IssueForm: React.FC<IssueFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
  isSubmitting,
  submitButtonText = "제출",
  isEditMode = false,
}) => {
  const [content, setContent] = useState('');
  const [reporter, setReporter] = useState('');
  const [assignee, setAssignee] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<StatusEnum>(ResolutionStatus.OPEN);

  const [contentError, setContentError] = useState('');
  const [reporterError, setReporterError] = useState('');

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content || '');
      setReporter(initialData.reporter || '');
      setAssignee(initialData.assignee || '');
      setComment(initialData.comment || '');
      setStatus(initialData.status || ResolutionStatus.OPEN);
    } else {
      // Reset form for adding new issue or if initialData is cleared
      setContent('');
      setReporter('');
      setAssignee('');
      setComment('');
      setStatus(ResolutionStatus.OPEN);
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let isValid = true;
    if (!content.trim()) {
      setContentError('이슈 내용은 비워둘 수 없습니다.');
      isValid = false;
    } else {
      setContentError('');
    }
    if (!reporter.trim()) {
      setReporterError('등록자 이름은 비워둘 수 없습니다.');
      isValid = false;
    } else {
      setReporterError('');
    }

    if (isValid) {
      const formData: IssueFormData = {
        content: content.trim(),
        reporter: reporter.trim(),
        assignee: assignee.trim() || undefined,
        comment: comment.trim() || undefined,
      };
      if (isEditMode) {
        formData.status = status;
      }
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="issue-content" className="block text-sm font-medium text-slate-700 mb-1">
          이슈 설명 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="issue-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (contentError && e.target.value.trim()) setContentError('');
          }}
          rows={4}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${contentError ? 'border-red-500' : 'border-slate-300'}`}
          placeholder="이슈에 대해 자세히 설명해주세요..."
          required
          disabled={isSubmitting}
        />
        {contentError && <p className="mt-1 text-xs text-red-600">{contentError}</p>}
      </div>

      <div>
        <label htmlFor="issue-reporter" className="block text-sm font-medium text-slate-700 mb-1">
          등록자 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="issue-reporter"
          value={reporter}
          onChange={(e) => {
            setReporter(e.target.value);
            if (reporterError && e.target.value.trim()) setReporterError('');
          }}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${reporterError ? 'border-red-500' : 'border-slate-300'}`}
          placeholder="이름 또는 식별자"
          required
          disabled={isSubmitting}
        />
        {reporterError && <p className="mt-1 text-xs text-red-600">{reporterError}</p>}
      </div>

      <div>
        <label htmlFor="issue-assignee" className="block text-sm font-medium text-slate-700 mb-1">
          담당자 (선택 사항)
        </label>
        <input
          type="text"
          id="issue-assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="담당자 이름 또는 팀"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="issue-comment" className="block text-sm font-medium text-slate-700 mb-1">
          코멘트 (선택 사항)
        </label>
        <textarea
          id="issue-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="추가 코멘트를 입력하세요..."
          disabled={isSubmitting}
        />
      </div>
      
      {isEditMode && (
        <div>
          <label htmlFor="issue-status" className="block text-sm font-medium text-slate-700 mb-1">
            상태
          </label>
          <select
            id="issue-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusEnum)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            disabled={isSubmitting}
          >
            {(Object.keys(ResolutionStatus) as Array<keyof typeof ResolutionStatus>).map(statusKey => (
              <option key={statusKey} value={ResolutionStatus[statusKey]}>
                {statusDisplayNames[ResolutionStatus[statusKey]]}
              </option>
            ))}
          </select>
        </div>
      )}


      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-70"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-50"
        >
          {!isEditMode && <PlusIcon className="w-5 h-5 mr-2 -ml-1" />}
          {isSubmitting ? '저장 중...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};