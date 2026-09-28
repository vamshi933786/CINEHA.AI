export const HOOK_TAXONOMIES = [
  "Curiosity",
  "Contrarian",
  "Problem-Solution",
  "Storytelling",
  "Question",
  "Bold Statement",
  "List / Number",
  "Fear / Mistake",
  "Transformation",
] as const;

export type HookTaxonomy = (typeof HOOK_TAXONOMIES)[number];

export interface HookItem {
  id: string;
  hook_text: string;
  category: HookTaxonomy | string;
  language: string;
  platform: string;
  delivery_style: string;
  visual_framing: string;
  retention_intent: string;
}

export interface HookGenerationRequest {
  topic: string;
  context?: string;
  platform: string;
  language?: string;
  count: number;
  categories?: string[];
  creator_profile?: any;
}

export interface HookGenerationResponse {
  success: boolean;
  hooks: HookItem[];
  count: number;
  provider_used: string;
  persona_used?: string | null;
  generated_at: string;
}
