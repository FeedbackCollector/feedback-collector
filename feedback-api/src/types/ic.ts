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