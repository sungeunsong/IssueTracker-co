import React, { useState } from 'react';

export default function NewIssueForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
    <form onSubmit={submit}>
      <h2>New Issue</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <button type="submit">Create</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
