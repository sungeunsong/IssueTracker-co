import IssueList from './components/IssueList.js';
import IssueDetail from './components/IssueDetail.js';
import NewIssueForm from './components/NewIssueForm.js';

export default function App() {
  const [view, setView] = React.useState('list');
  const [selectedId, setSelectedId] = React.useState(null);

  if (view === 'detail') {
    return React.createElement(IssueDetail, {
      issueId: selectedId,
      onBack: () => setView('list')
    });
  }

  if (view === 'new') {
    return React.createElement(NewIssueForm, {
      onCreated: () => setView('list'),
      onCancel: () => setView('list')
    });
  }

  return React.createElement(IssueList, {
    onSelect: id => {
      setSelectedId(id);
      setView('detail');
    },
    onNew: () => setView('new')
  });
}
