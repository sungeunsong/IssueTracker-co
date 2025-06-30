
export type ResolutionStatus = string;


export enum IssueType {
  TASK = "TASK",
  BUG = "BUG",
  NEW_FEATURE = "NEW_FEATURE",
  IMPROVEMENT = "IMPROVEMENT",
}

export type IssuePriority = string;
export const DEFAULT_PRIORITIES: IssuePriority[] = [
  "HIGHEST",
  "HIGH",
  "MEDIUM",
  "LOW",
  "LOWEST",
];
export const DEFAULT_RESOLUTIONS: string[] = [
  "완료",
  "원하지 않음",
  "재현 불가",
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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  resolvedAt?: string; // ISO date string when issue is resolved/closed
  resolution?: string;
  type: IssueType; // New
  priority: IssuePriority;
  affectsVersion?: string; // New
  fixVersion?: string; // New
  projectId: string;
  attachments?: Attachment[];
  history?: IssueHistoryEntry[];
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
  userid: string;
  username: string;
  isAdmin?: boolean;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  statuses?: string[];
  priorities?: IssuePriority[];
  resolutions?: string[];
}

export const statusColors: Record<string, string> = {
  '열림': 'bg-blue-100 text-blue-800 ring-blue-600/20',
  '수정 중': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  '수정 완료': 'bg-teal-100 text-teal-800 ring-teal-600/20',
  '검증': 'bg-purple-100 text-purple-800 ring-purple-600/20',
  '닫힘': 'bg-slate-100 text-slate-800 ring-slate-600/20',
  '원치 않음': 'bg-gray-100 text-gray-800 ring-gray-600/20',
};

export const issueTypeDisplayNames: Record<IssueType, string> = {
  [IssueType.TASK]: "작업",
  [IssueType.BUG]: "버그",
  [IssueType.NEW_FEATURE]: "새 기능",
  [IssueType.IMPROVEMENT]: "개선",
};

export const issueTypeColors: Record<IssueType, string> = {
  [IssueType.TASK]: 'bg-sky-100 text-sky-800 ring-sky-600/20',
  [IssueType.BUG]: 'bg-red-100 text-red-800 ring-red-600/20',
  [IssueType.NEW_FEATURE]: 'bg-lime-100 text-lime-800 ring-lime-600/20',
  [IssueType.IMPROVEMENT]: 'bg-amber-100 text-amber-800 ring-amber-600/20',
};

export const issuePriorityDisplayNames: Record<string, string> = {
  HIGHEST: 'Highest',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  LOWEST: 'Lowest',
};

export const issuePriorityColors: Record<string, string> = {
  HIGHEST: 'border-red-500',
  HIGH: 'border-orange-500',
  MEDIUM: 'border-yellow-500',
  LOW: 'border-green-500',
  LOWEST: 'border-blue-500',
};
export const getPriorityDisplayName = (p: string) =>
  issuePriorityDisplayNames[p] || p;


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

