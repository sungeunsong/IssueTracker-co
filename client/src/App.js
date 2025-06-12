export default function App() {
  const [issues, setIssues] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/issues')
      .then(res => res.json())
      .then(data => setIssues(data.issues || []));
  }, []);

  return (
    React.createElement('div', null,
      React.createElement('h1', null, 'Issues'),
      React.createElement('ul', null,
        issues.map(i =>
          React.createElement('li', { key: i.id }, `${i.title} - ${i.status}`)
        )
      )
    )
  );
}
