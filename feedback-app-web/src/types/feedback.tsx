export type Feedback = {
  id: number;
  author_id: number;
  ic_id: number | null;
  ic_name: string | null;
  project_id: number | null;
  project_name: string | null;
  date: string;
  source_name: string;
  score: number;
  comment: string | null;
  screenshot_url: string | null;
  created_at: string;
};

export type FeedbackFilters = {
  icName: string;
  projectId: string;
  score: string;
  sortBy: 'newest' | 'oldest';
  text: string;
};

export type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

export type Project = {
  id: number;
  name: string;
};

export type FeedbackPageResponse = {
  data: Feedback[];
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number 
  };
};
