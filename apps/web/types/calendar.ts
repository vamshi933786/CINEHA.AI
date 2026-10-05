export type ContentStatus =
  | "Idea"
  | "Planned"
  | "Script Ready"
  | "In Production"
  | "Ready to Publish"
  | "Published"
  | "Archived";

export type PlatformType =
  | "Instagram Reels"
  | "YouTube Shorts"
  | "TikTok"
  | "Facebook Reels"
  | "Other";

export type ContentType =
  | "Educational"
  | "Storytelling"
  | "Tutorial"
  | "Behind the Scenes"
  | "Review"
  | "Opinion"
  | "List"
  | "Transformation"
  | "Announcement"
  | "Entertainment"
  | "Other";

export type ContentPriority = "Low" | "Medium" | "High" | "Urgent";

export type CalendarViewMode = "month" | "week" | "agenda";

export interface LinkedScriptSummary {
  id: string;
  title: string;
  current_version: number;
  duration_seconds: number;
  language: string;
  updated_at: string;
}

export interface LinkedVideoAnalysisSummary {
  id: string;
  filename: string;
  overall_score: number;
  overall_rating: string;
  top_finding?: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string | null;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string | null;
  status: ContentStatus;
  platform: PlatformType;
  content_type: ContentType;
  language: string;
  script_id?: string | null;
  script_version_id?: string | number | null;
  hook_id?: string | null;
  video_analysis_id?: string | null;
  content_pillar?: string | null;
  content_goal?: string | null;
  priority: ContentPriority;
  tags: string[];
  notes?: string | null;
  cta?: string | null;
  created_at: string;
  updated_at: string;
  script_summary?: LinkedScriptSummary | null;
  video_analysis_summary?: LinkedVideoAnalysisSummary | null;
}

export interface ContentItemPayload {
  title: string;
  description?: string | null;
  scheduled_date: string;
  scheduled_time?: string | null;
  status?: ContentStatus;
  platform?: PlatformType;
  content_type?: ContentType;
  language?: string;
  script_id?: string | null;
  script_version_id?: string | number | null;
  hook_id?: string | null;
  video_analysis_id?: string | null;
  content_pillar?: string | null;
  content_goal?: string | null;
  priority?: ContentPriority;
  tags?: string[];
  notes?: string | null;
  cta?: string | null;
}

export interface ContentPlanSuggestion {
  title: string;
  description: string;
  suggested_date: string;
  platform: string;
  content_type: string;
  content_pillar: string;
  language: string;
  suggested_duration: string;
  cta: string;
  rationale: string;
}

export interface GenerateContentPlanRequest {
  planning_period_days?: number;
  posting_frequency?: string;
  content_goals?: string[];
  start_date?: string;
}

export interface GenerateContentPlanResponse {
  suggestions: ContentPlanSuggestion[];
  period_days: number;
  frequency: string;
  is_ai_generated: boolean;
  summary_note: string;
}

export interface CalendarDashboardStats {
  total_items: number;
  planned_count: number;
  ready_to_publish_count: number;
  published_count: number;
  platform_breakdown: Record<string, number>;
  content_type_breakdown: Record<string, number>;
  pillar_coverage: Record<string, number>;
}

export interface CalendarQueryParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  platform?: string;
  content_type?: string;
  content_pillar?: string;
  priority?: string;
  search?: string;
}

export const STATUS_OPTIONS: ContentStatus[] = [
  "Idea",
  "Planned",
  "Script Ready",
  "In Production",
  "Ready to Publish",
  "Published",
  "Archived",
];

export const PLATFORM_OPTIONS: PlatformType[] = [
  "Instagram Reels",
  "YouTube Shorts",
  "TikTok",
  "Facebook Reels",
  "Other",
];

export const CONTENT_TYPE_OPTIONS: ContentType[] = [
  "Educational",
  "Storytelling",
  "Tutorial",
  "Behind the Scenes",
  "Review",
  "Opinion",
  "List",
  "Transformation",
  "Announcement",
  "Entertainment",
  "Other",
];

export const PRIORITY_OPTIONS: ContentPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];
