export type CommonStatus =
  | "Complete"
  | "Deprioritised"
  | "Dev Complete"
  | "Dev in Progress"
  | "Handed Over To QA"
  | "In Solutioning"
  | "Not Started"
  | "On Hold"
  | "QA Complete"
  | "QA In Progress"
  | "Ready For Release"
  | "Released To Prod"
  | "Removed"
  | "Scrapped"
  | "Solutioned"
  | "Waiting for Approval from Product";

export type ReleaseStatus =
  | "SRE Pending"
  | "SRE Done"
  | "CAB Review Pending"
  | "CAB Review Done"
  | "Ready For Release"
  | "Released";

export type RwtStatus = "RWT Pending" | "RWT Completed";

export const COMMON_STATUS_OPTIONS: CommonStatus[] = [
  "Not Started",
  "In Solutioning",
  "Solutioned",
  "Dev in Progress",
  "Dev Complete",
  "Handed Over To QA",
  "QA In Progress",
  "QA Complete",
  "Ready For Release",
  "Released To Prod",
  "On Hold",
  "Waiting for Approval from Product",
  "Deprioritised",
  "Scrapped",
  "Removed",
  "Complete",
];

export const RELEASE_STATUS_OPTIONS: ReleaseStatus[] = [
  "SRE Pending",
  "SRE Done",
  "CAB Review Pending",
  "CAB Review Done",
  "Ready For Release",
  "Released",
];

export const RWT_STATUS_OPTIONS: RwtStatus[] = ["RWT Pending", "RWT Completed"];

export const SERVICE_OPTIONS = [
  "ASP - UI",
  "cart-and-order",
  "chitragupt",
  "clickstream-product-suggestion(onboarding)",
  "commission-engine",
  "computron-ext",
  "distributor-inventory-platform",
  "dms-service",
  "dms-serviceability",
  "hogwarts",
  "JMD B2B -UI",
  "JMD Dist - UI",
  "jmd-backend",
  "jmd-order-proxy",
  "order-guru",
  "PBG Dist - UI",
  "search-service",
  "super-coin-service",
  "taxman",
  "user-access-control",
  "Validexa",
];

export const COLLABORATOR_OPTIONS = [
  "Babasaheb",
  "Mukesh Bade",
  "Shruti",
  "StoreSellQA",
  "Malati",
  "Suraj",
  "Kishore",
  "Kamlesh",
  "Prasoon",
  "Suresh",
  "Suraj",
  "Sunderrajan",
  "Ganapati",
  "Rhishabh",
  "Amrit",
  "Navneet",
  "Abhishek",
  "Vicky",
  "Fynd Team",
  "B Rajesh",
  "Manas",
  "Devaraj",
  "Abhishek"

];

export interface CommonTask {
  id: string;
  adoId: string;
  taskName: string;
  status: CommonStatus;
  collaborators: string[];
  DevStartDate: Date | null;
  DevDueDate: Date | null;
  QAStartDate: Date | null;
  QAEndDate: Date | null;
  remarks: string;
  committedDate: Date | null;
}

export interface ReleaseTask {
  id: string;
  adoId: string;
  item: string;
  status: ReleaseStatus[];
  crLink: string;
  jmdbId: string;
  services: string[];
  remarks: string;
  committedDate: Date | null;
}

export interface RwtTask {
  id: string;
  feature: string;
  status: RwtStatus;
  collaborators: string[];
  startDate: Date | null;
  endDate: Date | null;
  remarks: string;
}

export interface StandupData {
  planning: CommonTask[];
  devQa: CommonTask[];
  prod: CommonTask[];
  release: ReleaseTask[];
  rwt: RwtTask[];
  meetingNotes: string;
}

export const EMPTY_STANDUP_DATA: StandupData = {
  planning: [],
  devQa: [],
  prod: [],
  release: [],
  rwt: [],
  meetingNotes: "",
};

const reviveDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

const reviveCommonTask = (task: Partial<CommonTask>): CommonTask => ({
  id: task.id ?? crypto.randomUUID(),
  adoId: task.adoId ?? "",
  taskName: task.taskName ?? "",
  status: (task.status as CommonStatus) ?? "Not Started",
  collaborators: Array.isArray(task.collaborators) ? task.collaborators : [],
  DevStartDate: reviveDate(task.DevStartDate),
  DevDueDate: reviveDate(task.DevDueDate),
  QAStartDate: reviveDate(task.QAStartDate),
  QAEndDate: reviveDate(task.QAEndDate),
  remarks: task.remarks ?? "",
  committedDate: reviveDate(task.committedDate),
});

const reviveReleaseTask = (task: Partial<ReleaseTask>): ReleaseTask => ({
  id: task.id ?? crypto.randomUUID(),
  adoId: task.adoId ?? "",
  item: task.item ?? "",
  status: Array.isArray(task.status) ? (task.status as ReleaseStatus[]) : [],
  crLink: task.crLink ?? "",
  jmdbId: task.jmdbId ?? "",
  services: Array.isArray(task.services) ? task.services : [],
  remarks: task.remarks ?? "",
  committedDate: reviveDate(task.committedDate),
});

const reviveRwtTask = (task: Partial<RwtTask>): RwtTask => ({
  id: task.id ?? crypto.randomUUID(),
  feature: task.feature ?? "",
  status: (task.status as RwtStatus) ?? "RWT Pending",
  collaborators: Array.isArray(task.collaborators) ? task.collaborators : [],
  startDate: reviveDate(task.startDate),
  endDate: reviveDate(task.endDate),
  remarks: task.remarks ?? "",
});

export const reviveStandupData = (raw?: Partial<StandupData> | null): StandupData => {
  if (!raw) {
    return EMPTY_STANDUP_DATA;
  }

  return {
    planning: (raw.planning ?? []).map(reviveCommonTask),
    devQa: (raw.devQa ?? []).map(reviveCommonTask),
    prod: (raw.prod ?? []).map(reviveCommonTask),
    release: (raw.release ?? []).map(reviveReleaseTask),
    rwt: (raw.rwt ?? []).map(reviveRwtTask),
    meetingNotes: raw.meetingNotes ?? "",
  };
};
