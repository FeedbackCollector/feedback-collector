export interface Area {
    id: number;
    name: string;
}

export interface NewArea {
    name: string;
}

export type UpdateArea = Partial<NewArea>;
