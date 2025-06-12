export default function IssueDetail({ issueId, onBack }) {
  const [issue, setIssue] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/issues/' + issueId)
      .then(res => res.json())
      .then(setIssue);
  }, [issueId]);

  if (!issue) return React.createElement('div', null, 'Loading...');

  return (
    React.createElement('div', null,
      React.createElement('button', { onClick: onBack }, 'Back'),
      React.createElement('h2', null, issue.title),
      React.createElement('p', null, issue.description),
      React.createElement('p', null, 'Status: ' + issue.status)
    )
  );
}
