export interface IC {
    IC_id: number;
    name: string;
    title: string;
    manager_id: number;
    area_id: number | null;
    entries: number;
    score: number | null;
}

export interface NewIC {
    name: string;
    title: string;
    manager_id: number;
    entries: number;
}


export type UpdateIC = Partial<NewIC>;

export type CreateICRecord = NewIC & { area_id: number | null };

export interface ICFilters {
    name?: string;
    title?: string;
    manager_id?: number;
    area_id?: number;
    score?: number;
    page: number;
    limit: number;
}
