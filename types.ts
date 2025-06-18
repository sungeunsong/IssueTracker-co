
export enum ResolutionStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface Issue {
  id: string;
  content: string;
  reporter: string;
  status: ResolutionStatus;
  createdAt: string; // ISO date string
}
    