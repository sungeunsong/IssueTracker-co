import React, { useState, useEffect, useMemo } from "react";
import type {
  Issue,
  ResolutionStatus as StatusEnum,
  IssuePriority as PriorityEnum,
  Project,
  User,
  Version,
  StatusItem,
  PriorityItem,
  TypeItem,
} from "../types";
import { DEFAULT_ISSUE_TYPES } from "../types";
import { PlusIcon } from "./icons/PlusIcon";
import { RichTextEditor } from "./RichTextEditor";
import { MentionTextarea } from "./MentionTextarea";
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
  currentUserName: string | null | undefined;
  statuses: StatusItem[];
  priorities: PriorityItem[];
  types: TypeItem[];
  components: string[];
  customers: string[];
  showCustomers?: boolean;
  showComponents?: boolean;
}

interface TypeOption {
  label: string;
  value: string;
  icon: string;
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
  statuses,
  priorities,
  types,
  components,
  customers,
  showCustomers = true,
  showComponents = true,
}) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<StatusEnum>(
    statuses[0]
      ? typeof statuses[0] === "object"
        ? statuses[0].name
        : statuses[0]
      : ""
  );
  const [type, setType] = useState<string>(
    types[0]
      ? typeof types[0] === "object"
        ? types[0].id
        : types[0]
      : DEFAULT_ISSUE_TYPES[0]?.id || ""
  );
  const [priority, setPriority] = useState<PriorityEnum>(
    priorities[0]
      ? typeof priorities[0] === "object"
        ? priorities[0].id
        : priorities[0]
      : ""
  );
  const [componentValue, setComponentValue] = useState("");
  const [customerValue, setCustomerValue] = useState("");
  const [affectsVersion, setAffectsVersion] = useState("");
  const [fixVersion, setFixVersion] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  const [contentError, setContentError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [reporterError, setReporterError] = useState("");
  const [typeError, setTypeError] = useState("");

  // 초기에 업무 유형에 아이콘을 삽입하자
  const typesWithIcon = useMemo<TypeOption[]>(() => {
    return types.map((type): TypeOption => {
      // type이 TypeItem 객체인지 문자열인지 확인
      const typeName = typeof type === "object" ? type.name : type;
      const typeValue = typeof type === "object" ? type.id : type;

      if (typeName === "버그") {
        return { label: typeName, value: typeValue, icon: "🐞" };
      } else if (typeName === "개선") {
        return { label: typeName, value: typeValue, icon: "⬆️" };
      } else if (typeName === "작업") {
        return { label: typeName, value: typeValue, icon: "📝" };
      } else if (typeName === "새 기능") {
        return { label: typeName, value: typeValue, icon: "➕" };
      } else if (typeName === "라이선스") {
        return { label: typeName, value: typeValue, icon: "📜" };
      } else {
        return { label: typeName, value: typeValue, icon: "📦" };
      }
    });
  }, [types]);

  // 우선순위도 삽입
  const prioritiesWithIcon = useMemo<TypeOption[]>(() => {
    return priorities.map((priority): TypeOption => {
      // priority가 PriorityItem 객체인지 문자열인지 확인
      const priorityName =
        typeof priority === "object" ? priority.name : priority;
      const priorityValue =
        typeof priority === "object" ? priority.id : priority;

      let upString = priorityName.toUpperCase();
      if (upString === "HIGHEST") {
        return { label: priorityName, value: priorityValue, icon: "🔥" }; // 가장 시급
      } else if (upString === "HIGH") {
        return { label: priorityName, value: priorityValue, icon: "⚠️" }; // 높은 중요도
      } else if (upString === "MEDIUM") {
        return { label: priorityName, value: priorityValue, icon: "📌" }; // 일반
      } else if (upString === "LOW") {
        return { label: priorityName, value: priorityValue, icon: "💤" }; // 낮음
      } else if (upString === "LOWEST") {
        return { label: priorityName, value: priorityValue, icon: "🧊" }; // 가장 낮음
      } else {
        return { label: priorityName, value: priorityValue, icon: "📦" }; // 기타
      }
    });
  }, [priorities]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setReporterId(initialData.reporter || "");
      const reporterUser = users.find((u) => u.userid === initialData.reporter);
      setReporterName(reporterUser ? reporterUser.username : "");
      setAssignee(initialData.assignee || "");
      setComment(initialData.comment || "");
      setStatus(
        initialData.status ||
          (statuses[0]
            ? typeof statuses[0] === "object"
              ? statuses[0].name
              : statuses[0]
            : "")
      );
      setType(
        initialData.typeId ||
          initialData.type ||
          (types[0]
            ? typeof types[0] === "object"
              ? types[0].id
              : types[0]
            : DEFAULT_ISSUE_TYPES[0]?.id || "")
      );
      setPriority(
        initialData.priorityId ||
          initialData.priority ||
          (priorities[0]
            ? typeof priorities[0] === "object"
              ? priorities[0].id
              : priorities[0]
            : "")
      );
      setComponentValue(initialData.component || "");
      setCustomerValue(initialData.customer || "");
      setAffectsVersion(initialData.affectsVersion || "");
      setFixVersion(initialData.fixVersion || "");
      setProjectId(
        initialData.projectId || selectedProjectId || projects[0]?.id || ""
      );
    } else {
      // Reset form for adding new issue
      setTitle("");
      setContent("");
      setReporterId(currentUserId || "");
      setReporterName(currentUserName || "");
      setAssignee("");
      setComment("");
      setStatus(
        statuses[0]
          ? typeof statuses[0] === "object"
            ? statuses[0].name
            : statuses[0]
          : ""
      );
      setType(
        types[0]
          ? typeof types[0] === "object"
            ? types[0].id
            : types[0]
          : DEFAULT_ISSUE_TYPES[0]?.id || ""
      );
      setPriority(
        priorities[0]
          ? typeof priorities[0] === "object"
            ? priorities[0].id
            : priorities[0]
          : ""
      );
      setComponentValue("");
      setCustomerValue("");
      setAffectsVersion("");
      setFixVersion("");
      setProjectId(selectedProjectId || projects[0]?.id || "");
    }
    setContentError("");
    setTitleError("");
    setReporterError("");
    setTypeError("");
  }, [initialData, isEditMode, users, currentUserId, currentUserName]); // Rerun if props change

  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}/versions`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setVersions(data as Version[]))
        .catch(() => setVersions([]));
    } else {
      setVersions([]);
    }
  }, [projectId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let isValid = true;
    if (!title.trim()) {
      setTitleError("이슈 제목은 비워둘 수 없습니다.");
      isValid = false;
    } else {
      setTitleError("");
    }
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
        title: title.trim(),
        content: content.trim(),
        reporter: reporterId.trim(),
        assignee: assignee.trim() || undefined,
        comment: comment.trim() || undefined,
        type: type,
        priority: priority,
        component: componentValue.trim() || undefined,
        customer: customerValue.trim() || undefined,
        affectsVersion: affectsVersion.trim() || undefined,
        projectId,
        attachments,
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
          htmlFor="issue-title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="issue-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError && e.target.value.trim()) setTitleError("");
          }}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
            titleError ? "border-red-500" : "border-slate-300"
          }`}
          required
          disabled={isSubmitting}
        />
        {titleError && (
          <p className="mt-1 text-xs text-red-600">{titleError}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="issue-type"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          업무 유형 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="issue-type"
            value={type}
            onChange={(e) => {
              const newType = e.target.value;
              setType(newType);
              if (typeError) setTypeError("");
              
              // 라이선스 유형 선택 시 스니펫 자동 삽입
              if (newType === "license" && !content.trim()) {
                const licenseSnippet = `용도: \n고객사: \n노드 수량: \n유효기간: \n유효IP: `;
                setContent(licenseSnippet);
              }
            }}
            className={`mt-1 block w-full shadow-sm sm:text-sm border rounded-md py-2 px-3 ${
              typeError ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isSubmitting}
            required
          >
            {typesWithIcon.map(({ value, label, icon }) => (
              <option key={value} value={value}>
                {icon} {label}
              </option>
            ))}
          </select>
          {typeError && (
            <p className="mt-1 text-xs text-red-600">{typeError}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="issue-priority"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          우선순위 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="issue-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityEnum)}
            className={`mt-1 block w-full shadow-sm sm:text-sm border rounded-md py-2 px-3 ${
              typeError ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isSubmitting}
            required
          >
            {prioritiesWithIcon.map(({ value, label, icon }) => (
              <option key={value} value={value}>
                {icon} {label}
              </option>
            ))}
          </select>
          {typeError && (
            <p className="mt-1 text-xs text-red-600">{typeError}</p>
          )}
        </div>
      </div>

      {showCustomers && (
        <div>
          <label
            htmlFor="issue-customer"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            고객사
          </label>
          <select
            id="issue-customer"
            value={customerValue}
            onChange={(e) => setCustomerValue(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            disabled={isSubmitting}
          >
            <option value="">선택 없음</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {showComponents && (
        <div>
          <label
            htmlFor="issue-component"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            컴포넌트
          </label>
          <select
            id="issue-component"
            value={componentValue}
            onChange={(e) => setComponentValue(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            disabled={isSubmitting}
          >
            <option value="">선택 없음</option>
            {components.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor="issue-content"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          이슈 설명 <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={content}
          onChange={(val) => {
            setContent(val);
            if (contentError && val.trim()) setContentError("");
          }}
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
              {statuses.map((st) => {
                const statusName = typeof st === "object" ? st.name : st;
                const statusValue = typeof st === "object" ? st.id : st;
                return (
                  <option key={statusValue} value={statusName}>
                    {statusName}
                  </option>
                );
              })}
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
          <select
            id="issue-affectsVersion"
            value={affectsVersion}
            onChange={(e) => setAffectsVersion(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
            disabled={isSubmitting}
          >
            <option value="">선택 없음</option>
            {versions.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        {isEditMode && (
          <div>
            <label
              htmlFor="issue-fixVersion"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              수정 버전
            </label>
            <select
              id="issue-fixVersion"
              value={fixVersion}
              onChange={(e) => setFixVersion(e.target.value)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
              disabled={isSubmitting}
            >
              <option value="">선택 없음</option>
              {versions.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
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
        <MentionTextarea
          value={comment}
          onChange={(val) => setComment(val)}
          projectId={projectId}
          placeholder="추가 코멘트 (선택) - @를 입력하면 사용자 멘션 가능"
          rows={3}
        />
      </div>

      <div>
        <label
          htmlFor="issue-files"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          첨부 파일
        </label>
        <input
          id="issue-files"
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files || []))}
          className="mt-1 block w-full text-sm text-slate-700"
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
