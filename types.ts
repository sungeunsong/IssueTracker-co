
export enum ResolutionStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface Issue {
  id: string;
  issueKey: string;
  content: string;
  reporter: string;
  status: ResolutionStatus;
  projectId: string;
  createdAt: string; // ISO date string
}
    