import React, { useState } from 'react';

interface ProjectFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('프로젝트 이름을 입력하세요.');
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 mb-1">
          프로젝트 이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-slate-300'}`}
          disabled={isSubmitting}
          required
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          disabled={isSubmitting}
        >
          프로젝트 생성
        </button>
      </div>
    </form>
  );
};
