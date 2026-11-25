export interface Project {
    id: number;
    name: string;
}

export interface NewProject {
    name: string;
}
export type UpdateProject = Partial<NewProject>;
