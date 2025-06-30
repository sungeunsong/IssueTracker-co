
export type ResolutionStatus = string;

export const DEFAULT_RESOLUTIONS: string[] = [
  "완료",
  "원하지 않음",
  "재현 불가",
];

export interface StatusOption {
  id: string;
  name: string;
}

export interface Issue {
  id: string;
  issueKey: string;
  content: string;
  reporter: string;
  status: ResolutionStatus;
  priority?: string;
  projectId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  resolvedAt?: string; // ISO date string when issue is resolved/closed
  resolution?: string;
  history?: IssueHistoryEntry[];
}

export interface IssueHistoryEntry {
  userId: string;
  action: string;
  timestamp: string;
  changes?: string[];
  comment?: string;
}
    