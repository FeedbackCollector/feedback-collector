export type Feedback = {
  id: number;
  ic_id: number | null;
  ic_name: string | null;
  project_id: number | null;
  project_name: string | null;
  date: string;
  source_name: string;
  text: string;
  score: number;
  comment: string;
  screenshot_url: string | null;
  created_at: string;
};

export type FeedbackFilters = {
  icName: string;
  projectId: string;
  score: string;
  sortBy: string;
  text: string;
};