
export enum ResolutionStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED", // Represents "수정 완료"
  VALIDATING = "VALIDATING", // New "검증" status
  CLOSED = "CLOSED",
  WONT_DO = "WONT_DO",
}

export enum IssueType {
  TASK = "TASK",
  BUG = "BUG",
  NEW_FEATURE = "NEW_FEATURE",
  IMPROVEMENT = "IMPROVEMENT",
}

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
  type: IssueType; // New
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
}

export const statusColors: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  [ResolutionStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  [ResolutionStatus.RESOLVED]: 'bg-teal-100 text-teal-800 ring-teal-600/20',
  [ResolutionStatus.VALIDATING]: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  [ResolutionStatus.CLOSED]: 'bg-slate-100 text-slate-800 ring-slate-600/20',
  [ResolutionStatus.WONT_DO]: 'bg-gray-100 text-gray-800 ring-gray-600/20',
};

export const statusDisplayNames: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: "열림",
  [ResolutionStatus.IN_PROGRESS]: "수정 중",
  [ResolutionStatus.RESOLVED]: "수정 완료",
  [ResolutionStatus.VALIDATING]: "검증",
  [ResolutionStatus.CLOSED]: "닫힘",
  [ResolutionStatus.WONT_DO]: "원치 않음",
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


export interface BoardColumn {
  id: ResolutionStatus;
  title: string;
  issues: Issue[];
}

export const boardStatuses: ResolutionStatus[] = [
  ResolutionStatus.OPEN,
  ResolutionStatus.IN_PROGRESS,
  ResolutionStatus.RESOLVED,
  ResolutionStatus.VALIDATING,
];

export const boardStatusToTitleMap: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: statusDisplayNames[ResolutionStatus.OPEN],
  [ResolutionStatus.IN_PROGRESS]: statusDisplayNames[ResolutionStatus.IN_PROGRESS],
  [ResolutionStatus.RESOLVED]: statusDisplayNames[ResolutionStatus.RESOLVED],
  [ResolutionStatus.VALIDATING]: statusDisplayNames[ResolutionStatus.VALIDATING],
  [ResolutionStatus.CLOSED]: statusDisplayNames[ResolutionStatus.CLOSED],
  [ResolutionStatus.WONT_DO]: statusDisplayNames[ResolutionStatus.WONT_DO],
};

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

