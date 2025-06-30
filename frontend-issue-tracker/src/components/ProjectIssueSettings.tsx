import React, { useEffect, useState } from 'react';
import { DEFAULT_PRIORITIES, DEFAULT_RESOLUTIONS } from '../types';
import EditableList from './EditableList'; // 재사용할 자식 컴포넌트

interface Props {
  projectId: string;
}

const ProjectIssueSettings: React.FC<Props> = ({ projectId }) => {
  // 현재 상태
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState<string[]>([]);

  // 변경 여부(isDirty)를 확인하기 위한 초기 상태
  const [initialStatuses, setInitialStatuses] = useState<string[]>([]);
  const [initialPriorities, setInitialPriorities] = useState<string[]>([]);
  const [initialResolutions, setInitialResolutions] = useState<string[]>([]);

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/issue-settings`);
        if (res.ok) {
          const data = await res.json();
          // 현재 상태와 초기 상태를 모두 설정
          setStatuses(data.statuses || []);
          setPriorities(data.priorities || DEFAULT_PRIORITIES);
          setResolutions(data.resolutions || DEFAULT_RESOLUTIONS);

          setInitialStatuses(data.statuses || []);
          setInitialPriorities(data.priorities || DEFAULT_PRIORITIES);
          setInitialResolutions(data.resolutions || DEFAULT_RESOLUTIONS);
        } else {
          // API 실패 시 기본값으로 설정
          setStatuses([]);
          setPriorities(DEFAULT_PRIORITIES);
          setResolutions(DEFAULT_RESOLUTIONS);
          setInitialStatuses([]);
          setInitialPriorities(DEFAULT_PRIORITIES);
          setInitialResolutions(DEFAULT_RESOLUTIONS);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issue-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statuses, priorities, resolutions }),
      });

      if (res.ok) {
        // 저장이 성공하면 초기 상태를 현재 상태로 업데이트하여 '저장' 버튼을 다시 비활성화
        setInitialStatuses(statuses);
        setInitialPriorities(priorities);
        setInitialResolutions(resolutions);
      } else {
        // 에러 처리 (예: 사용자에게 Toast 알림)
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 하나라도 변경되었는지 확인
  const isDirty =
    JSON.stringify(statuses) !== JSON.stringify(initialStatuses) ||
    JSON.stringify(priorities) !== JSON.stringify(initialPriorities) ||
    JSON.stringify(resolutions) !== JSON.stringify(initialResolutions);

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="space-y-6">
        {/* 재사용 컴포넌트를 사용하여 각 목록을 렌더링 */}
        <EditableList
          title="Issue Statuses"
          items={statuses}
          setItems={setStatuses}
          placeholder="새 상태"
        />
        <EditableList
          title="Issue Priorities"
          items={priorities}
          setItems={setPriorities}
          placeholder="새 우선순위"
        />
        <EditableList
          title="Resolution Reasons"
          items={resolutions}
          setItems={setResolutions}
          placeholder="새 해결 사유"
        />
      </div>

      <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold shadow-sm
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                     disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
};

export default ProjectIssueSettings;