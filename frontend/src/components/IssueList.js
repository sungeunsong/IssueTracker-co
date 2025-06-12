import React, { useState, useEffect } from 'react';

export default function IssueList({ onSelect, onNew }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetch('/api/issues')
      .then(res => res.json())
      .then(data => setIssues(data.issues || []));
  }, []);

  return (
    <div>
      <h2>Issues</h2>
      <ul>
        {issues.map(issue => (
          <li key={issue.id}>
            <a href="#" onClick={() => onSelect(issue.id)}>{issue.title}</a> - {issue.status}
          </li>
        ))}
      </ul>
      <button onClick={onNew}>New Issue</button>
    </div>
  );
}
