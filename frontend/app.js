const { useState, useEffect } = React;

function IssueList({ onSelect, onNew }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
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

function IssueDetail({ issueId, onBack }) {
  const [issue, setIssue] = useState(null);
  useEffect(() => {
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

function NewIssueForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const submit = (e) => {
    e.preventDefault();
    fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    })
      .then(res => res.json())
      .then(() => {
        onCreated();
      });
  };
  return (
    React.createElement('form', { onSubmit: submit },
      React.createElement('h2', null, 'New Issue'),
      React.createElement('input', {
        placeholder: 'Title',
        value: title,
        onChange: e => setTitle(e.target.value)
      }),
      React.createElement('textarea', {
        placeholder: 'Description',
        value: description,
        onChange: e => setDescription(e.target.value)
      }),
      React.createElement('button', { type: 'submit' }, 'Create'),
      React.createElement('button', { type: 'button', onClick: onCancel }, 'Cancel')
    )
  );
}

function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

  if (view === 'detail') {
    return React.createElement(IssueDetail, { issueId: selectedId, onBack: () => setView('list') });
  }
  if (view === 'new') {
    return React.createElement(NewIssueForm, { onCreated: () => { setView('list'); }, onCancel: () => setView('list') });
  }
  return React.createElement(IssueList, {
    onSelect: id => { setSelectedId(id); setView('detail'); },
    onNew: () => setView('new')
  });
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
