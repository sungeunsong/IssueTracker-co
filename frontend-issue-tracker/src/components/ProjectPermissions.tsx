import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface Props {
  projectId: string;
  users: User[];
}

interface ProjectPermissions {
  readUsers: string[];
  writeUsers: string[];
  adminUsers: string[];
}

export const ProjectPermissions: React.FC<Props> = ({ projectId, users }) => {
  const [permissions, setPermissions] = useState<ProjectPermissions>({
    readUsers: [],
    writeUsers: [],
    adminUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/permissions`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(data);
        }
      } catch (error) {
        console.error('권한 정보를 불러오는 중 오류가 발생했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [projectId]);

  const handlePermissionChange = (userId: string, permissionType: 'read' | 'write' | 'admin', checked: boolean) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      if (permissionType === 'read') {
        if (checked) {
          newPermissions.readUsers = [...prev.readUsers, userId];
        } else {
          newPermissions.readUsers = prev.readUsers.filter(id => id !== userId);
        }
      } else if (permissionType === 'write') {
        if (checked) {
          newPermissions.writeUsers = [...prev.writeUsers, userId];
        } else {
          newPermissions.writeUsers = prev.writeUsers.filter(id => id !== userId);
        }
      } else if (permissionType === 'admin') {
        if (checked) {
          newPermissions.adminUsers = [...prev.adminUsers, userId];
        } else {
          newPermissions.adminUsers = prev.adminUsers.filter(id => id !== userId);
        }
      }
      
      return newPermissions;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions),
      });

      if (res.ok) {
        alert('권한이 성공적으로 저장되었습니다.');
      } else {
        alert('권한 저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('권한 저장 중 오류가 발생했습니다:', error);
      alert('권한 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">권한 안내</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>읽기 권한:</strong> 이슈를 볼 수 있지만 추가나 수정은 불가능</li>
          <li>• <strong>쓰기 권한:</strong> 이슈를 등록할 수 있고 본인이 등록한 이슈만 볼 수 있음</li>
          <li>• <strong>관리자 권한:</strong> 프로젝트의 모든 권한과 프로젝트 설정 접근 가능</li>
          <li>• <strong>권한 없음:</strong> 프로젝트 리스트에 해당 프로젝트가 노출되지 않음</li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">사용자 권한 관리</h3>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">사용자</th>
                  <th className="text-center py-3 px-4 font-semibold">읽기 권한</th>
                  <th className="text-center py-3 px-4 font-semibold">쓰기 권한</th>
                  <th className="text-center py-3 px-4 font-semibold">관리자 권한</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.userid} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                          {(user.name || user.username || user.userid).charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || user.username}</div>
                          <div className="text-sm text-gray-500">{user.userid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.readUsers.includes(user.userid)}
                        onChange={(e) => handlePermissionChange(user.userid, 'read', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.writeUsers.includes(user.userid)}
                        onChange={(e) => handlePermissionChange(user.userid, 'write', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.adminUsers.includes(user.userid)}
                        onChange={(e) => handlePermissionChange(user.userid, 'admin', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '권한 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPermissions;