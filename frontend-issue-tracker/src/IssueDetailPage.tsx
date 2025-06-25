import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Issue } from './types';
import { IssueDetailsView } from './components/IssueDetailsView';

export const IssueDetailPage: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIssue = async () => {
      const res = await fetch(`/api/issues/key/${issueKey}`);
      if (res.ok) {
        const data: Issue = await res.json();
        setIssue(data);
      } else {
        const err = await res.json().catch(() => ({ message: '이슈를 불러올 수 없습니다.' }));
        setError(err.message || '이슈를 불러올 수 없습니다.');
      }
    };
    fetchIssue();
  }, [issueKey]);

  if (error) {
    return (
      <div className="p-6">
        <Link to="/" className="text-indigo-600 hover:underline">← Back</Link>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-6">Loading...</div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Link to="/" className="text-indigo-600 hover:underline">← Back</Link>
      <h1 className="text-xl font-semibold">{issue.issueKey} - {issue.title}</h1>
      <IssueDetailsView issue={issue} />
    </div>
  );
};

export default IssueDetailPage;
