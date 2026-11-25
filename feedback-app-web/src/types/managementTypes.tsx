export type ManagementTab = 'Areas' | 'Managers' | 'ICs' | 'Projects' | 'Directors';

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
  managerIds?: number[];
  managerNames?: string;
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
  managers: Array<{ id: number; name: string; email?: string; directorId?: number | null }>;
  pendingAccounts: PendingAccount[];
  individualContributors?: ManagementIC[];
}

export interface ManagementIC {
  id: number;
  name: string;
  title: string;
  managerId: number | null;
  managerName: string | null;
  directorId: number | null;
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
  director_id?: number | null;
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
  manager_id: number | null;
  director_id: number | null;
  area_id: number | null;
  entries: number;
  score?: number | null;
}

export interface APIProject {
  id: number;
  name: string;
  manager_ids: number[];
}

export interface APIFeedback {
  id: number;
  ic_id: number;
  project_id: number;
  date: string;
  score: number;
  comment: string | null;
}