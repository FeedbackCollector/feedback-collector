export interface NewReview {
    ic_id: number;
    author_id: number;
    project_id: number | null;
    origin: string;
    source_title: string | null;
    text: string;
    score: number;
    occurred_on: string;
    screenshot_path: string | null;
}

export type ReviewChanges = Partial<Omit<NewReview, "ic_id" | "author_id">>;

export interface Screenshot {
    buffer: Buffer;
    ext: "png" | "jpg";
}

export interface ReviewInput {
    screenshot?: Screenshot;
    occurred_on?: string;
    project_id?: number | null;
    origin?: string;
    source_title?: string;
    text?: string;
    score?: number;
    remove_screenshot?: boolean;
}

export interface ReviewEntry {
    id: number;
    date: string;
    source: string;
    source_title: string | null;
    comment: string;
    score: number;
    project: { id: number; name: string } | null;
    screenshot_url: string | null;
}

export interface ICReview {
    ic: { IC_id: number; name: string; title: string };
    stats: { entries: number; average: number | null };
    trend: number[];        
    entries: ReviewEntry[]; 
}