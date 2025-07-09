export type ResolutionStatus = string;
export type ResolutionStatusId = string;

export type IssueType = string;
export type IssueTypeId = string;

export type IssuePriority = string;
export type IssuePriorityId = string;

export type ResolutionId = string;

// ID 기반 설정 항목 인터페이스
export interface StatusItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface TypeItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface PriorityItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ResolutionItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

export const DEFAULT_ISSUE_TYPES: TypeItem[] = [
  { id: "task", name: "작업", color: "sky", order: 1 },
  { id: "bug", name: "버그", color: "red", order: 2 },
  { id: "feature", name: "새 기능", color: "lime", order: 3 },
  { id: "improvement", name: "개선", color: "yellow", order: 4 },
];

export const DEFAULT_PRIORITIES: PriorityItem[] = [
  { id: "highest", name: "HIGHEST", color: "red", order: 1 },
  { id: "high", name: "HIGH", color: "orange", order: 2 },
  { id: "medium", name: "MEDIUM", color: "yellow", order: 3 },
  { id: "low", name: "LOW", color: "green", order: 4 },
  { id: "lowest", name: "LOWEST", color: "blue", order: 5 },
];

export const DEFAULT_STATUSES: StatusItem[] = [
  { id: "open", name: "열림", color: "blue", order: 1 },
  { id: "in_progress", name: "수정 중", color: "yellow", order: 2 },
  { id: "resolved", name: "수정 완료", color: "teal", order: 3 },
  { id: "verified", name: "검증", color: "purple", order: 4 },
  { id: "closed", name: "닫힘", color: "gray", order: 5 },
  { id: "rejected", name: "원치 않음", color: "gray", order: 6 },
];

export const DEFAULT_RESOLUTIONS: ResolutionItem[] = [
  { id: "completed", name: "완료", color: "green", order: 1 },
  { id: "rejected", name: "원하지 않음", color: "gray", order: 2 },
  { id: "cannot_reproduce", name: "재현 불가", color: "orange", order: 3 },
];

export interface Issue {
  id: string;
  issueKey: string;
  title: string;
  content: string;
  reporter: string;
  assignee?: string;
  comment?: string;
  comments?: IssueComment[];
  status: ResolutionStatus;
  statusId: ResolutionStatusId;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  resolvedAt?: string; // ISO date string when issue is resolved/closed
  resolution?: string;
  resolutionId?: ResolutionId;
  type: IssueType;
  typeId: IssueTypeId;
  priority: IssuePriority;
  priorityId: IssuePriorityId;
  component?: string;
  customer?: string;
  affectsVersion?: string;
  fixVersion?: string;
  projectId: string;
  attachments?: Attachment[];
  history?: IssueHistoryEntry[];
}

export interface IssueWithProject extends Issue {
  showCustomers?: boolean;
  showComponents?: boolean;
}

export interface Attachment {
  filename: string;
  originalName: string;
}

export interface IssueComment {
  userId: string;
  text: string;
  createdAt: string;
}

export interface IssueHistoryEntry {
  userId: string;
  action: string;
  timestamp: string;
  changes?: string[];
  comment?: string;
  fromStatus?: ResolutionStatus;
  toStatus?: ResolutionStatus;
}

export interface User {
  id: string;
  userid: string;
  username: string;
  name: string;
  isAdmin?: boolean;
  profileImage?: string;
  department?: string;
  position?: string;
  manager?: string;
  employeeId?: string;
  workPhone?: string;
  email?: string;
  role?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  statuses?: StatusItem[];
  priorities?: PriorityItem[];
  resolutions?: ResolutionItem[];
  types?: TypeItem[];
  components?: string[];
  customers?: string[];
  showCustomers?: boolean;
  showComponents?: boolean;
}

// 기존 호환성을 위한 정적 색상 매핑 (마이그레이션 중 사용)
export const statusColors: Record<string, string> = {
  열림: "bg-blue-100 text-blue-800 ring-blue-600/20",
  "수정 중": "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  "수정 완료": "bg-teal-100 text-teal-800 ring-teal-600/20",
  검증: "bg-purple-100 text-purple-800 ring-purple-600/20",
  닫힘: "bg-slate-100 text-slate-800 ring-slate-600/20",
  "원치 않음": "bg-gray-100 text-gray-800 ring-gray-600/20",
};

export const issueTypeColors: Record<string, string> = {
  작업: "bg-sky-100 text-sky-800 ring-sky-600/20",
  버그: "bg-red-100 text-red-800 ring-red-600/20",
  "새 기능": "bg-lime-100 text-lime-800 ring-lime-600/20",
  개선: "bg-amber-100 text-amber-800 ring-amber-600/20",
};

export const issuePriorityColors: Record<string, string> = {
  HIGHEST: "border-red-500",
  HIGH: "border-orange-500",
  MEDIUM: "border-yellow-500",
  LOW: "border-green-500",
  LOWEST: "border-blue-500",
};

// 색상 매핑 유틸리티 함수들
export function getStatusColor(
  statusName: string,
  statuses: StatusItem[]
): string {
  const status = statuses.find((s) => s.name === statusName);
  if (status) {
    return `bg-${status.color}-100 text-${status.color}-800 ring-${status.color}-600/20`;
  }
  return (
    statusColors[statusName] || "bg-gray-100 text-gray-800 ring-gray-600/20"
  );
}

export function getTypeColor(typeName: string, types: TypeItem[]): string {
  const type = types.find((t) => t.name === typeName);
  if (type) {
    return `bg-${type.color}-100 text-${type.color}-800 ring-${type.color}-600/20`;
  }
  return (
    issueTypeColors[typeName] || "bg-gray-100 text-gray-800 ring-gray-600/20"
  );
}

export function getPriorityColor(
  priorityName: string,
  priorities: PriorityItem[]
): string {
  const priority = priorities.find((p) => p.name === priorityName);
  if (priority) {
    return `border-${priority.color}-500`;
  }
  return issuePriorityColors[priorityName] || "border-gray-500";
}

// ID로 이름을 찾는 유틸리티 함수들
export function getStatusNameById(
  statusId: string,
  statuses: StatusItem[]
): string {
  const status = statuses.find((s) => s.id === statusId);
  return status?.name || statusId;
}

export function getTypeNameById(typeId: string, types: TypeItem[]): string {
  const type = types.find((t) => t.id === typeId);
  return type?.name || typeId;
}

export function getPriorityNameById(
  priorityId: string,
  priorities: PriorityItem[]
): string {
  const priority = priorities.find((p) => p.id === priorityId);
  return priority?.name || priorityId;
}

export function getResolutionNameById(
  resolutionId: string,
  resolutions: ResolutionItem[]
): string {
  const resolution = resolutions.find((r) => r.id === resolutionId);
  return resolution?.name || resolutionId;
}

// ID로 색상을 찾는 유틸리티 함수들
export function getStatusColorById(
  statusId: string,
  statuses: StatusItem[]
): string {
  const status = statuses.find((s) => s.id === statusId);
  if (status) {
    return `bg-${status.color}-100 text-${status.color}-800 ring-${status.color}-600/20`;
  }
  // Fallback to name-based lookup for backward compatibility
  const statusName = getStatusNameById(statusId, statuses);
  return (
    statusColors[statusName] || "bg-gray-100 text-gray-800 ring-gray-600/20"
  );
}

export function getTypeColorById(typeId: string, types: TypeItem[]): string {
  const type = types.find((t) => t.id === typeId);
  if (type) {
    return `bg-${type.color}-100 text-${type.color}-800 ring-${type.color}-600/20`;
  }
  // Fallback to name-based lookup for backward compatibility
  const typeName = getTypeNameById(typeId, types);
  return (
    issueTypeColors[typeName] || "bg-gray-100 text-gray-800 ring-gray-600/20"
  );
}

export function getPriorityColorById(
  priorityId: string,
  priorities: PriorityItem[]
): string {
  const priority = priorities.find((p) => p.id === priorityId);
  if (priority) {
    return `border-${priority.color}-500`;
  }
  // Fallback to name-based lookup for backward compatibility
  const priorityName = getPriorityNameById(priorityId, priorities);
  return issuePriorityColors[priorityName] || "border-gray-500";
}

export interface BoardColumn {
  id: ResolutionStatus;
  title: string;
  issues: Issue[];
}

export interface Version {
  id: string;
  projectId: string;
  name: string;
  startDate?: string;
  releaseDate?: string;
  leader: string;
  description?: string;
  released: boolean;
}

export interface Component {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  owners: string[];
  issueCount?: number;
}

export interface Customer {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  owners: string[];
  issueCount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: "new-issue" | "mention";
  message: string;
  issueId: string;
  issueKey: string;
  read: boolean;
  createdAt: string;
}
