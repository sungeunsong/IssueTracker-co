import React, { useState, useEffect } from 'react';
import type { User, Version } from '../types';

interface VersionFormProps {
  initialData?: Partial<Version>;
  onSubmit: (data: Partial<Version>) => Promise<void>;
  onCancel: () => void;
  users: User[];
  currentUserId: string | null;
  submitText?: string;
}

export const VersionForm: React.FC<VersionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  users,
  currentUserId,
  submitText = '저장',
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [leader, setLeader] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setStartDate(initialData.startDate || '');
      setReleaseDate(initialData.releaseDate || '');
      setLeader(initialData.leader || currentUserId || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setStartDate('');
      setReleaseDate('');
      setLeader(currentUserId || '');
      setDescription('');
    }
  }, [initialData, currentUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !leader) return;
    onSubmit({
      name: name.trim(),
      startDate: startDate || undefined,
      releaseDate: releaseDate || undefined,
      leader,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ver-name" className="block text-sm font-medium text-slate-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="ver-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ver-start" className="block text-sm font-medium text-slate-700 mb-1">
            시작 날짜
          </label>
          <input
            id="ver-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
          />
        </div>
        <div>
          <label htmlFor="ver-release" className="block text-sm font-medium text-slate-700 mb-1">
            릴리즈 날짜
          </label>
          <input
            id="ver-release"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ver-leader" className="block text-sm font-medium text-slate-700 mb-1">
          추진자 <span className="text-red-500">*</span>
        </label>
        <select
          id="ver-leader"
          value={leader}
          onChange={(e) => setLeader(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
          required
        >
          {users.map((u) => (
            <option key={u.userid} value={u.userid}>
              {u.username}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ver-desc" className="block text-sm font-medium text-slate-700 mb-1">
          설명
        </label>
        <textarea
          id="ver-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3"
        />
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

export default VersionForm;
