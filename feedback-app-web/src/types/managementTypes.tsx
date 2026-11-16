export type ManagementTab = 'Areas' | 'Managers' | 'ICs' | 'Projects';

export interface ManagementRow {
  id: number;
  name: string;
  managers?: number;
  ics?: number;
  averageScore?: number;
  area?: string;
  manager?: string;
  entries?: number;
  email?: string;
  areaId?: number;
  managerId?: number;
  title?: string;
  feedbackEntries?: ManagerFeedback[];
}

export interface ManagerFeedback {
  id: number;
  icName: string;
  projectName: string;
  date: string;
  score: number;
  comment: string | null;
}

export interface ManagementData {
  rows: ManagementRow[];
  areas: Array<{ id: number; name: string }>;
  managers: Array<{ id: number; name: string }>;
  pendingAccounts: PendingAccount[];
  individualContributors?: ManagementIC[];
}

export interface ManagementIC {
  id: number;
  name: string;
  title: string;
  managerId: number;
  managerName: string;
}

export interface PendingAccount {
  id: number;
  name: string;
  email: string;
  areaId: number | null;
}

export interface ManagementFormValues {
  name: string;
  email: string;
  password: string;
  areaId: string;
  title: string;
  managerId: string;
  entries: string;
}

export interface APIUser {
  id: number;
  name: string;
  email: string;
  role: string;
  area_id: number | null;
  status?: 'pending' | 'approved';
}

export interface APIArea {
  id: number;
  name: string;
}

export interface APIC {
  IC_id: number;
  name: string;
  title: string;
  manager_id: number;
  entries: number;
}

export interface APIProject {
  id: number;
  name: string;
}

export interface APIFeedback {
  id: number;
  ic_id: number;
  project_id: number;
  date: string;
  score: number;
  comment: string | null;
}