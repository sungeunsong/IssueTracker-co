
export enum ResolutionStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  WONT_DO = "WONT_DO", // New status
}

export interface Issue {
  id: string;
  content: string;
  reporter: string;
  assignee?: string; // Optional assignee field
  comment?: string; // Optional comment field
  status: ResolutionStatus;
  createdAt: string; // ISO date string
}

export const statusColors: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  [ResolutionStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  [ResolutionStatus.RESOLVED]: 'bg-green-100 text-green-800 ring-green-600/20',
  [ResolutionStatus.CLOSED]: 'bg-slate-100 text-slate-800 ring-slate-600/20',
  [ResolutionStatus.WONT_DO]: 'bg-purple-100 text-purple-800 ring-purple-600/20', // Color for new status
};

export const statusDisplayNames: Record<ResolutionStatus, string> = {
  [ResolutionStatus.OPEN]: "진행 전",
  [ResolutionStatus.IN_PROGRESS]: "진행 중",
  [ResolutionStatus.RESOLVED]: "해결됨",
  [ResolutionStatus.CLOSED]: "종료됨",
  [ResolutionStatus.WONT_DO]: "원치 않음", // Display name for new status
};