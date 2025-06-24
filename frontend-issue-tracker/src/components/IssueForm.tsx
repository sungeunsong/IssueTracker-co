import React, { useState, useEffect } from "react";
import type {
  Issue,
  ResolutionStatus as StatusEnum,
  IssueType as TypeEnum,
  Project,
  User,
} from "../types";
import {
  ResolutionStatus,
  statusDisplayNames,
  IssueType,
  issueTypeDisplayNames,
} from "../types";
import { PlusIcon } from "./icons/PlusIcon";
import type { IssueFormData } from "../App";

interface IssueFormProps {
  onSubmit: (formData: IssueFormData) => Promise<void>;
  initialData?: Partial<Issue>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  isEditMode?: boolean;
  projects: Project[];
  selectedProjectId: string | null;
  users: User[];
  currentUserId: string | null;
  currentUserName: string | null;
}

export const IssueForm: React.FC<IssueFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
  isSubmitting,
  submitButtonText = "제출",
  isEditMode = false,
  projects,
  selectedProjectId,
  users,
  currentUserId,
  currentUserName,
}) => {
  const [content, setContent] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<StatusEnum>(ResolutionStatus.OPEN);
  const [type, setType] = useState<TypeEnum>(IssueType.TASK); // Default to TASK
  const [affectsVersion, setAffectsVersion] = useState("");
  const [fixVersion, setFixVersion] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  const [contentError, setContentError] = useState("");
  const [reporterError, setReporterError] = useState("");
  const [typeError, setTypeError] = useState("");

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content || "");
      setReporterId(initialData.reporter || "");
      const reporterUser = users.find((u) => u.userid === initialData.reporter);
      setReporterName(reporterUser ? reporterUser.username : "");
      setAssignee(initialData.assignee || "");
      setComment(initialData.comment || "");
      setStatus(initialData.status || ResolutionStatus.OPEN);
      setType(initialData.type || IssueType.TASK);
      setAffectsVersion(initialData.affectsVersion || "");
      setFixVersion(initialData.fixVersion || "");
      setProjectId(
        initialData.projectId || selectedProjectId || projects[0]?.id || ""
      );
    } else {
      // Reset form for adding new issue
      setContent("");
      setReporterId(currentUserId || "");
      setReporterName(currentUserName || "");
      setAssignee("");
      setComment("");
      setStatus(ResolutionStatus.OPEN);
      setType(IssueType.TASK); // Default for new issues
      setAffectsVersion("");
      setFixVersion("");
      setProjectId(selectedProjectId || projects[0]?.id || "");
    }
    setContentError("");
    setReporterError("");
    setTypeError("");
  }, [initialData, isEditMode, users, currentUserId, currentUserName]); // Rerun if props change

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let isValid = true;
    if (!content.trim()) {
      setContentError("이슈 내용은 비워둘 수 없습니다.");
      isValid = false;
    } else {
      setContentError("");
    }
    if (!reporterId.trim()) {
      setReporterError("등록자 이름은 비워둘 수 없습니다.");
      isValid = false;
    } else {
      setReporterError("");
    }
    if (!type) {
      // Should always have a value due to select default
      setTypeError("업무 유형을 선택해주세요.");
      isValid = false;
    } else {
      setTypeError("");
    }

    if (isValid) {
      const formData: IssueFormData = {
        content: content.trim(),
        reporter: reporterId.trim(),
        assignee: assignee.trim() || undefined,
        comment: comment.trim() || undefined,
        type: type,
        affectsVersion: affectsVersion.trim() || undefined,
        projectId,
      };
      if (isEditMode) {
        formData.status = status;
        formData.fixVersion = fixVersion.trim() || undefined;
      }
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="issue-project"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          프로젝트 <span className="text-red-500">*</span>
        </label>
        <select
          id="issue-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
          disabled={isSubmitting || isEditMode}
          required
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="issue-type"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          업무 유형 <span className="text-red-500">*</span>
        </label>
        <select
          id="issue-type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as TypeEnum);
            if (typeError) setTypeError("");
          }}
          className={`mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 ${
            typeError ? "border-red-500" : "border-slate-300"
          }`}
          disabled={isSubmitting}
          required
        >
          {(Object.keys(IssueType) as Array<keyof typeof IssueType>).map(
            (typeKey) => (
              <option key={typeKey} value={IssueType[typeKey]}>
                {issueTypeDisplayNames[IssueType[typeKey]]}
              </option>
            )
          )}
        </select>
        {typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>}
      </div>

      <div>
        <label
          htmlFor="issue-content"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          이슈 설명 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="issue-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (contentError && e.target.value.trim()) setContentError("");
          }}
          rows={3}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
            contentError ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="이슈에 대해 자세히 설명해주세요..."
          required
          disabled={isSubmitting}
        />
        {contentError && (
          <p className="mt-1 text-xs text-red-600">{contentError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="issue-reporter"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          등록자 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="issue-reporter"
          value={reporterName}
          readOnly
          className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-slate-300 bg-slate-100"
          disabled
        />
        {reporterError && (
          <p className="mt-1 text-xs text-red-600">{reporterError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="issue-assignee"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            담당자
          </label>
          <select
            id="issue-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            disabled={isSubmitting}
          >
            <option value="">미지정</option>
            {users.map((u) => (
              <option key={u.userid} value={u.userid}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        {isEditMode && (
          <div>
            <label
              htmlFor="issue-status"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              상태
            </label>
            <select
              id="issue-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusEnum)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
              disabled={isSubmitting}
            >
              {(
                Object.keys(ResolutionStatus) as Array<
                  keyof typeof ResolutionStatus
                >
              ).map((statusKey) => (
                <option key={statusKey} value={ResolutionStatus[statusKey]}>
                  {statusDisplayNames[ResolutionStatus[statusKey]]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="issue-affectsVersion"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            영향을 받는 버전
          </label>
          <input
            type="text"
            id="issue-affectsVersion"
            value={affectsVersion}
            onChange={(e) => setAffectsVersion(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="예: 1.0.0 (선택)"
            disabled={isSubmitting}
          />
        </div>
        {isEditMode && (
          <div>
            <label
              htmlFor="issue-fixVersion"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              수정 버전
            </label>
            <input
              type="text"
              id="issue-fixVersion"
              value={fixVersion}
              onChange={(e) => setFixVersion(e.target.value)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="예: 1.0.1 (선택)"
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="issue-comment"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          코멘트
        </label>
        <textarea
          id="issue-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="추가 코멘트 (선택)"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-70"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-50"
        >
          {!isEditMode && <PlusIcon className="w-4 h-4 mr-1.5 -ml-0.5" />}
          {isSubmitting ? "저장 중..." : submitButtonText}
        </button>
      </div>
    </form>
  );
};
