import React, { useEffect, useState } from 'react';
import { 
  DEFAULT_PRIORITIES, 
  DEFAULT_RESOLUTIONS, 
  DEFAULT_ISSUE_TYPES, 
  DEFAULT_STATUSES,
  StatusItem,
  TypeItem,
  PriorityItem,
  ResolutionItem
} from '../types';
import { EditableKeyValueList } from './EditableList';

interface Props {
  projectId: string;
}

const ProjectIssueSettings: React.FC<Props> = ({ projectId }) => {
  // 현재 상태 - ID 기반 객체 배열로 변경
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionItem[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);

  // 변경 여부(isDirty)를 확인하기 위한 초기 상태
  const [initialStatuses, setInitialStatuses] = useState<StatusItem[]>([]);
  const [initialPriorities, setInitialPriorities] = useState<PriorityItem[]>([]);
  const [initialResolutions, setInitialResolutions] = useState<ResolutionItem[]>([]);
  const [initialTypes, setInitialTypes] = useState<TypeItem[]>([]);

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
          
          // 서버에서 오는 데이터가 이미 ID 기반 객체 배열인지 문자열 배열인지 확인
          const processStatuses = (statuses: any[]) => {
            if (!statuses || statuses.length === 0) return DEFAULT_STATUSES;
            return statuses.map((s, idx) => 
              typeof s === 'object' ? s : { id: `status_${idx}`, name: s, color: 'blue', order: idx + 1 }
            );
          };
          
          const processPriorities = (priorities: any[]) => {
            if (!priorities || priorities.length === 0) return DEFAULT_PRIORITIES;
            return priorities.map((p, idx) => 
              typeof p === 'object' ? p : { id: `priority_${idx}`, name: p, color: 'yellow', order: idx + 1 }
            );
          };
          
          const processResolutions = (resolutions: any[]) => {
            if (!resolutions || resolutions.length === 0) return DEFAULT_RESOLUTIONS;
            return resolutions.map((r, idx) => 
              typeof r === 'object' ? r : { id: `resolution_${idx}`, name: r, color: 'green', order: idx + 1 }
            );
          };
          
          const processTypes = (types: any[]) => {
            if (!types || types.length === 0) return DEFAULT_ISSUE_TYPES;
            return types.map((t, idx) => 
              typeof t === 'object' ? t : { id: `type_${idx}`, name: t, color: 'sky', order: idx + 1 }
            );
          };

          // 현재 상태와 초기 상태를 모두 설정
          const processedStatuses = processStatuses(data.statuses);
          const processedPriorities = processPriorities(data.priorities);
          const processedResolutions = processResolutions(data.resolutions);
          const processedTypes = processTypes(data.types);
          
          setStatuses(processedStatuses);
          setPriorities(processedPriorities);
          setResolutions(processedResolutions);
          setTypes(processedTypes);

          setInitialStatuses(processedStatuses);
          setInitialPriorities(processedPriorities);
          setInitialResolutions(processedResolutions);
          setInitialTypes(processedTypes);
        } else {
          // API 실패 시 기본값으로 설정
          setStatuses(DEFAULT_STATUSES);
          setPriorities(DEFAULT_PRIORITIES);
          setResolutions(DEFAULT_RESOLUTIONS);
          setTypes(DEFAULT_ISSUE_TYPES);
          setInitialStatuses(DEFAULT_STATUSES);
          setInitialPriorities(DEFAULT_PRIORITIES);
          setInitialResolutions(DEFAULT_RESOLUTIONS);
          setInitialTypes(DEFAULT_ISSUE_TYPES);
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
        body: JSON.stringify({ statuses, priorities, resolutions, types }),
      });

      if (res.ok) {
        // 저장이 성공하면 초기 상태를 현재 상태로 업데이트하여 '저장' 버튼을 다시 비활성화
        setInitialStatuses(statuses);
        setInitialPriorities(priorities);
        setInitialResolutions(resolutions);
        setInitialTypes(types);
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
    JSON.stringify(resolutions) !== JSON.stringify(initialResolutions) ||
    JSON.stringify(types) !== JSON.stringify(initialTypes);

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="space-y-6">
        {/* ID-이름 쌍으로 편집 가능한 리스트들 */}
        <EditableKeyValueList
          title="Issue Statuses"
          items={statuses}
          setItems={setStatuses}
          defaultColor="blue"
        />
        <EditableKeyValueList
          title="Issue Types"
          items={types}
          setItems={setTypes}
          defaultColor="sky"
        />
        <EditableKeyValueList
          title="Issue Priorities"
          items={priorities}
          setItems={setPriorities}
          defaultColor="yellow"
        />
        <EditableKeyValueList
          title="Resolution Reasons"
          items={resolutions}
          setItems={setResolutions}
          defaultColor="green"
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