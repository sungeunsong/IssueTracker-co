import React, { useEffect, useState } from 'react';
import { DEFAULT_STATUSES, DEFAULT_PRIORITIES } from '../types';

interface Props {
  projectId: string;
}

const ProjectIssueSettings: React.FC<Props> = ({ projectId }) => {
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch(`/api/projects/${projectId}/issue-settings`);
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses || DEFAULT_STATUSES);
        setPriorities(data.priorities || DEFAULT_PRIORITIES);
      } else {
        setStatuses(DEFAULT_STATUSES);
        setPriorities(DEFAULT_PRIORITIES);
      }
    };
    fetchSettings();
  }, [projectId]);

  const handleSave = async () => {
    await fetch(`/api/projects/${projectId}/issue-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statuses, priorities }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Issue Statuses</h3>
        <ul className="space-y-2">
          {statuses.map((s, idx) => (
            <li key={idx} className="flex space-x-2">
              <input
                value={s}
                onChange={(e) =>
                  setStatuses(statuses.map((v, i) => (i === idx ? e.target.value : v)))
                }
                className="border border-slate-300 rounded px-2 py-1 flex-1"
              />
              <button
                onClick={() => setStatuses(statuses.filter((_, i) => i !== idx))}
                className="text-red-600 px-2"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex space-x-2">
          <input
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 flex-1"
            placeholder="새 상태"
          />
          <button
            onClick={() => {
              if (newStatus.trim()) {
                setStatuses([...statuses, newStatus.trim()]);
                setNewStatus('');
              }
            }}
            className="px-3 py-1 bg-slate-200 rounded"
          >
            추가
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Issue Priorities</h3>
        <ul className="space-y-2">
          {priorities.map((p, idx) => (
            <li key={idx} className="flex space-x-2">
              <input
                value={p}
                onChange={(e) =>
                  setPriorities(priorities.map((v, i) => (i === idx ? e.target.value : v)))
                }
                className="border border-slate-300 rounded px-2 py-1 flex-1"
              />
              <button
                onClick={() => setPriorities(priorities.filter((_, i) => i !== idx))}
                className="text-red-600 px-2"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex space-x-2">
          <input
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 flex-1"
            placeholder="새 우선순위"
          />
          <button
            onClick={() => {
              if (newPriority.trim()) {
                setPriorities([...priorities, newPriority.trim()]);
                setNewPriority('');
              }
            }}
            className="px-3 py-1 bg-slate-200 rounded"
          >
            추가
          </button>
        </div>
      </div>

      <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">
        저장
      </button>
    </div>
  );
};

export default ProjectIssueSettings;
