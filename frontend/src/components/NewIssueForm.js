export default function NewIssueForm({ onCreated, onCancel }) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  const submit = e => {
    e.preventDefault();
    fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setDescription('');
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
