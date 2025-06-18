
import React, { useState } from 'react';
import type { Issue } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface IssueFormProps {
  onAddIssue: (newIssueData: Omit<Issue, 'id' | 'createdAt' | 'status'>) => void;
}

export const IssueForm: React.FC<IssueFormProps> = ({ onAddIssue }) => {
  const [content, setContent] = useState('');
  const [reporter, setReporter] = useState('');
  const [contentError, setContentError] = useState('');
  const [reporterError, setReporterError] = useState('');

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
      onAddIssue({ content, reporter });
      setContent('');
      setReporter('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="issue-content" className="block text-sm font-medium text-slate-700 mb-1">
          이슈 설명
        </label>
        <textarea
          id="issue-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (contentError && e.target.value.trim()) setContentError('');
          }}
          rows={4}
          className={`mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${contentError ? 'border-red-500' : 'border-slate-300'}`}
          placeholder="이슈에 대해 자세히 설명해주세요..."
        />
        {contentError && <p className="mt-1 text-xs text-red-600">{contentError}</p>}
      </div>

      <div>
        <label htmlFor="issue-reporter" className="block text-sm font-medium text-slate-700 mb-1">
          등록자
        </label>
        <input
          type="text"
          id="issue-reporter"
          value={reporter}
          onChange={(e) => {
            setReporter(e.target.value);
            if (reporterError && e.target.value.trim()) setReporterError('');
          }}
          className={`mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${reporterError ? 'border-red-500' : 'border-slate-300'}`}
          placeholder="이름 또는 식별자"
        />
        {reporterError && <p className="mt-1 text-xs text-red-600">{reporterError}</p>}
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
      >
        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
        이슈 추가
      </button>
    </form>
  );
};