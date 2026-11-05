export interface IC {
    IC_id: number;
    name: string;
    title: string;
    manager_id: number;
    entries: number;
}

export interface NewIC {
    name: string;
    title: string;
    manager_id: number;
    entries: number;
}


export type UpdateIC = Partial<NewIC>;

export interface ICFilters {
    name?: string;
    title?: string;
    manager_id?: number;
    page: number;
    limit: number;
}
