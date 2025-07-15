import React, { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import { Modal } from "./Modal";
import VersionForm from "./VersionForm";
import type { Version, User } from "../types";
import { EllipsisVerticalIcon } from "./icons/EllipsisVerticalIcon";
import { UploadIcon } from "./icons/UploadIcon";
import { DownloadIcon } from "./icons/DownloadIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { DownloadAllIcon } from "./icons/DownloadAllIcon";

interface ActionMenuProps {
  onEdit: () => void;
  onToggleRelease: () => void;
  onDelete: () => void;
  isReleased: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  onEdit,
  onToggleRelease,
  onDelete,
  isReleased,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div>
        <button
          type="button"
          className="flex items-center text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          id="options-menu"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1" role="none">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              편집
            </button>
            <button
              onClick={() => {
                onToggleRelease();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              {isReleased ? "릴리즈 해제" : "릴리즈"}
            </button>
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-900"
              role="menuitem"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  projectId: string;
  users: User[];
  currentUserId: string | null;
}

interface FileUploadProps {
  versionId: string;
  projectId: string;
  onFileUploaded: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ versionId, projectId, onFileUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // 여러 파일을 formData에 추가
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`/api/versions/${versionId}/file`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        onFileUploaded();
      } else {
        console.error('파일 업로드 실패');
      }
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
        title="파일 업로드 (여러 파일 선택 가능)"
      >
        <UploadIcon className="h-4 w-4" />
      </button>
    </>
  );
};

interface FileListProps {
  version: Version;
  onFileUploaded: () => void;
}

const FileList: React.FC<FileListProps> = ({ version, onFileUploaded }) => {
  const hasFiles = version.attachments && version.attachments.length > 0;
  
  const handleFileDownload = async (filename: string, originalName: string) => {
    try {
      const response = await fetch(`/api/versions/${version.id}/file/${filename}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('파일 다운로드 중 오류:', error);
    }
  };

  const handleFileDelete = async (filename: string) => {
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/versions/${version.id}/file/${filename}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onFileUploaded(); // 목록 새로고침
      } else {
        console.error('파일 삭제 실패');
      }
    } catch (error) {
      console.error('파일 삭제 중 오류:', error);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await fetch(`/api/versions/${version.id}/files/download-all`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${version.name}-files.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('전체 파일 다운로드 중 오류:', error);
    }
  };

  if (!hasFiles) {
    return (
      <div className="text-xs text-slate-400">
        업로드된 파일 없음
      </div>
    );
  }

  const files = version.attachments!;
  const displayFiles = files.slice(0, 3); // 최대 3개까지만 표시
  const remainingCount = files.length - 3;

  return (
    <div className="space-y-1">
      {/* 전체 다운로드 버튼 */}
      {files.length > 1 && (
        <button
          onClick={handleDownloadAll}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          title="전체 파일 다운로드 (ZIP)"
        >
          <DownloadAllIcon className="h-3 w-3" />
          <span>전체 다운로드</span>
        </button>
      )}
      
      {/* 개별 파일 목록 */}
      {displayFiles.map((attachment, index) => (
        <div key={index} className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => handleFileDownload(attachment.filename, attachment.originalName)}
            className="text-slate-600 hover:text-slate-800 truncate max-w-32"
            title={attachment.originalName}
          >
            {attachment.originalName}
          </button>
          <button
            onClick={() => handleFileDelete(attachment.filename)}
            className="text-red-400 hover:text-red-600 p-0.5"
            title="파일 삭제"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      
      {/* 남은 파일 개수 표시 */}
      {remainingCount > 0 && (
        <div className="text-xs text-slate-400">
          +{remainingCount}개 파일 더
        </div>
      )}
    </div>
  );
};

export const ProjectVersions: React.FC<Props> = ({
  projectId,
  users,
  currentUserId,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editVersion, setEditVersion] = useState<Version | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/versions`);
    if (res.ok) {
      const data: Version[] = await res.json();
      setVersions(data);
    }
  }, [projectId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleSave = async (data: Partial<Version>) => {
    if (editVersion) {
      await fetch(`/api/versions/${editVersion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowModal(false);
    setEditVersion(null);
    fetchVersions();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/versions/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchVersions();
  };

  const toggleRelease = async (ver: Version) => {
    await fetch(`/api/versions/${ver.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ released: !ver.released }),
    });
    fetchVersions();
  };

  return (
    <div>
      <button
        onClick={() => {
          setShowModal(true);
        }}
        className="mb-4 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
      >
        버전 만들기
      </button>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-2 text-left font-semibold">이름</th>
            <th className="px-3 py-2 text-left font-semibold">시작</th>
            <th className="px-3 py-2 text-left font-semibold">릴리즈</th>
            <th className="px-3 py-2 text-left font-semibold">추진자</th>
            <th className="px-3 py-2 text-left font-semibold">상태</th>
            <th className="px-3 py-2 text-left font-semibold">파일</th>
            <th className="px-3 py-2 text-center font-semibold">추가 작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {versions.map((v) => (
            <tr key={v.id}>
              <td className="px-3 py-2 whitespace-nowrap">{v.name}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {v.startDate || "-"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {v.releaseDate || "-"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {users.find((u) => u.userid === v.leader)?.username || v.leader}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {v.released ? "릴리즈됨" : "미릴리즈"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-start space-x-2">
                  <FileUpload 
                    versionId={v.id} 
                    projectId={projectId} 
                    onFileUploaded={fetchVersions} 
                  />
                  <div className="flex-1 min-w-0">
                    <FileList 
                      version={v} 
                      onFileUploaded={fetchVersions}
                    />
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-center">
                <ActionMenu
                  onEdit={() => {
                    setEditVersion(v);
                    setShowModal(true);
                  }}
                  onToggleRelease={() => toggleRelease(v)}
                  onDelete={() => setDeleteId(v.id)}
                  isReleased={v.released}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditVersion(null);
        }}
        title="버전"
      >
        <VersionForm
          initialData={editVersion || undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setShowModal(false);
            setEditVersion(null);
          }}
          users={users}
          currentUserId={currentUserId}
          submitText={editVersion ? "저장" : "생성"}
        />
      </Modal>
      {deleteId && (
        <ConfirmationModal
          title="버전 삭제"
          message="선택한 버전을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default ProjectVersions;
