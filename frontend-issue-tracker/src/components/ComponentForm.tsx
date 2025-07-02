import React, { useState, useEffect } from "react";
import type { User, Component } from "../types";

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
  submitText = "저장",
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owners, setOwners] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setOwners(initialData.owners || []);
    } else {
      setName("");
      setDescription("");
      setOwners([]);
    }
  }, [initialData]);

  const handleOwnerChange = (userId: string) => {
    setOwners((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="comp-name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          컴포넌트 이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="comp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="comp-desc"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          설명
        </label>
        <textarea
          id="comp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          담당자
        </label>
        <div className="mt-2 p-3 border border-slate-300 rounded-md max-h-60 overflow-y-auto space-y-2 bg-slate-50/50">
          {users.length > 0 ? (
            users.map((user) => (
              <label
                key={user.userid}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={owners.includes(user.userid)}
                  onChange={() => handleOwnerChange(user.userid)}
                  className="h-4 w-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-800">{user.username}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              담당자로 지정할 사용자가 없습니다.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default ComponentForm;
