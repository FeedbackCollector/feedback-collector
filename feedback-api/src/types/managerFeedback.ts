export interface ManagerFeedback {
    id: number;
    author_id: number;
    manager_id: number;
    project_id: number;
    date: string;
    source_name: string;
    source_title: string | null;
    score: number;
    comment: string | null;
    screenshot_url: string | null;
    created_at: Date;
}

export interface NewManagerFeedback {
    author_id: number;
    manager_id: number;
    project_id: number;
    date: string;
    source_name: string;
    source_title: string | null;
    score: number;
    comment: string | null;
    screenshot_url: string | null;
}

export type UpdateManagerFeedback = Partial<NewManagerFeedback>;

export interface ManagerFeedbackFilters {
    manager_id?: number;
    project_id?: number;
    score?: number;
    sort?: 'newest' | 'oldest';
}
