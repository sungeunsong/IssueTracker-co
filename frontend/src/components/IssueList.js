export default function IssueList({ onSelect, onNew }) {
  const [issues, setIssues] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/issues')
      .then(res => res.json())
      .then(data => setIssues(data.issues || []));
  }, []);

  return (
    React.createElement('div', null,
      React.createElement('h2', null, 'Issues'),
      React.createElement('ul', null,
        issues.map(issue =>
          React.createElement('li', { key: issue.id },
            React.createElement('a', { href: '#', onClick: () => onSelect(issue.id) }, issue.title),
            ' - ', issue.status
          )
        )
      ),
      React.createElement('button', { onClick: onNew }, 'New Issue')
    )
  );
}
