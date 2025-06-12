import React, { useState, useEffect } from 'react';

export default function IssueDetail({ issueId, onBack }) {
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    fetch('/api/issues/' + issueId)
      .then(res => res.json())
      .then(setIssue);
  }, [issueId]);

  if (!issue) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h2>{issue.title}</h2>
      <p>{issue.description}</p>
      <p>Status: {issue.status}</p>
    </div>
  );
}
