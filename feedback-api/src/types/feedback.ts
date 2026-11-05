    // declare id: CreationOptional<number>;
    // declare author_id: string;
    // declare ic_id: string;
    // declare project_id: number;
    // declare date: Date;
    // declare source_name: string;
    // declare score: number;
    // declare comment: string;
    // declare screenshot_url: string;
    // declare created_at: CreationOptional<Date>;

export interface Feedback {
    id: number;
    author_id: number;
    ic_id: number;
    project_id: number;
    date: string;
    source_name: string;
    score: number;
    comment: string | null;
    screenshot_url: string | null;
    created_at: Date;
}

export interface NewFeedback {
    author_id: number;
    ic_id: number;
    project_id: number;
    date: string;
    source_name: string;
    score: number;
    comment: string | null;
    screenshot_url: string | null;
}

export type UpdateFeedback = Partial<NewFeedback>;

export interface FeedbackFilters {
    ic_id?: number;
    author_id?: number;
    project_id?: number;
}