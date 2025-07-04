import React, { useState } from 'react';

interface RegisterFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    userid: '',
    username: '',
    password: '',
    department: '',
    position: '',
    manager: '',
    employeeId: '',
    workPhone: '',
    email: '',
    role: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.userid.trim() || !formData.username.trim() || !formData.password) {
      setError('아이디, 이름, 비밀번호를 입력하세요.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="reg-userid" className="block text-sm font-medium text-slate-700 mb-1">
            아이디 <span className="text-red-500">*</span>
          </label>
          <input id="reg-userid" name="userid" type="text" value={formData.userid} onChange={handleChange} className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error && !formData.userid ? 'border-red-500' : 'border-slate-300'}`} disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-username" className="block text-sm font-medium text-slate-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input id="reg-username" name="username" type="text" value={formData.username} onChange={handleChange} className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error && !formData.username ? 'border-red-500' : 'border-slate-300'}`} disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input id="reg-password" name="password" type="password" value={formData.password} onChange={handleChange} className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${error && !formData.password ? 'border-red-500' : 'border-slate-300'}`} disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
          <input id="reg-email" name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-department" className="block text-sm font-medium text-slate-700 mb-1">부서</label>
          <input id="reg-department" name="department" type="text" value={formData.department} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-position" className="block text-sm font-medium text-slate-700 mb-1">직급</label>
          <input id="reg-position" name="position" type="text" value={formData.position} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 mb-1">역할</label>
          <input id="reg-role" name="role" type="text" value={formData.role} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
        </div>
        
        <div>
          <label htmlFor="reg-workPhone" className="block text-sm font-medium text-slate-700 mb-1">업무 연락처</label>
          <input id="reg-workPhone" name="workPhone" type="text" value={formData.workPhone} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md py-2 px-3 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors" disabled={isSubmitting}>취소</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors" disabled={isSubmitting}>회원가입</button>
      </div>
    </form>
  );
};
