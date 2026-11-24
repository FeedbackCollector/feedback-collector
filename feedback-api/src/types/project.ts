export interface Project {
    id: number;
    name: string;
    manager_ids: number[];
}

export interface NewProject {
    name: string;
    manager_ids?: number[];
}
export type UpdateProject = Partial<NewProject>;
