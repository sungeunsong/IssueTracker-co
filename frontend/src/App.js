import React, { useState } from 'react';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import NewIssueForm from './components/NewIssueForm';

export default function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

  if (view === 'detail') {
    return <IssueDetail issueId={selectedId} onBack={() => setView('list')} />;
  }

  if (view === 'new') {
    return (
      <NewIssueForm
        onCreated={() => setView('list')}
        onCancel={() => setView('list')}
      />
    );
  }

  return (
    <IssueList
      onSelect={id => {
        setSelectedId(id);
        setView('detail');
      }}
      onNew={() => setView('new')}
    />
  );
}
