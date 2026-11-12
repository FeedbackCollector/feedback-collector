export interface IC {
    IC_id: number;
    name: string;
    title: string;
    manager_id: number;
    area_id: number | null;
    entries: number;
}

export interface NewIC {
    name: string;
    title: string;
    manager_id: number;
    entries: number;
}


export type UpdateIC = Partial<NewIC>;

// area_id is derived from the assigned manager, never supplied by the client.
export type CreateICRecord = NewIC & { area_id: number | null };

export interface ICFilters {
    name?: string;
    title?: string;
    manager_id?: number;
    area_id?: number
    page: number;
    limit: number;
}
