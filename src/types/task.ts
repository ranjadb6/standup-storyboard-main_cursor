export type TaskStatus = "Not Started" | "In Progress" | "In Review" | "Blocked" | "Completed";

export interface Task {
  id: string;
  taskName: string;
  status: TaskStatus;
  collaborators: string[];
  devStartDate: Date | null;
  devDueDate: Date | null;
  qaStartDate: Date | null;
  qaEndDate: Date | null;
  remarks: string;
  committedDate: Date | null;
}

export const STATUS_OPTIONS: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "In Review",
  "Blocked",
  "Completed",
];

export const COLLABORATOR_OPTIONS = [
  "John Doe",
  "Jane Smith",
  "Mike Johnson",
  "Sarah Williams",
  "Tom Brown",
  "Emily Davis",
];
