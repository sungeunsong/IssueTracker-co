import React, { useState, useEffect } from 'react';
import type { User, Component } from '../types';

interface ComponentFormProps {
  initialData?: Partial<Component>;
  onSubmit: (data: Partial<Component>) => Promise<void>;
  onCancel: () => void;
  users: User[];
  submitText?: string;
}

export const ComponentForm: React.FC<ComponentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  users,
  submitText = '저장',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owners, setOwners] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setOwners(initialData.owners || []);
    } else {
      setName('');
      setDescription('');
      setOwners([]);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      owners,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comp-name" className="block text-sm font-medium text-slate-700 mb-1">
          컴포넌트 이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="comp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
          required
        />
      </div>
      <div>
        <label htmlFor="comp-desc" className="block text-sm font-medium text-slate-700 mb-1">
          설명
        </label>
        <textarea
          id="comp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
        />
      </div>
      <div>
        <label htmlFor="comp-owners" className="block text-sm font-medium text-slate-700 mb-1">
          담당자
        </label>
        <select
          id="comp-owners"
          multiple
          value={owners}
          onChange={(e) =>
            setOwners(Array.from(e.target.selectedOptions).map((o) => o.value))
          }
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
        >
          {users.map((u) => (
            <option key={u.userid} value={u.userid}>
              {u.username}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default ComponentForm;
