import React, { useState } from 'react';

interface RegisterFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    onSubmit(username.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reg-username" className="block text-sm font-medium text-slate-700 mb-1">
          아이디 <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-username"
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); if (error) setError(''); }}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-slate-300'}`}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-slate-300'}`}
          disabled={isSubmitting}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
          회원가입
        </button>
      </div>
    </form>
  );
};
