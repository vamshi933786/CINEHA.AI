import {
  MotionCaptionPreset,
  MotionCaptionSettings,
  MotionPresetDefinition,
} from "@/types/caption";

export const MOTION_PRESETS: Record<MotionCaptionPreset, MotionPresetDefinition> = {
  clean_pop: {
    id: "clean_pop",
    name: "Clean Pop",
    description:
      "Modern, crisp short-form pop. Subtle scaling on cue entrance, smooth active word subtle pop, clean dark pill background.",
    badge: "Popular",
    requiresWordTimings: false,
    settings: {
      preset: "clean_pop",
      entrance_animation: "pop",
      exit_animation: "fade",
      word_animation: "pop",
      intensity: "medium",
      active_word_style: "highlight",
      font_weight: "bold",
      primary_color: "#FFFFFF",
      active_color: "#22D3EE", // Cyan-400
      active_bg_color: "rgba(34, 211, 238, 0.2)",
      respect_reduced_motion: true,
    },
  },
  karaoke: {
    id: "karaoke",
    name: "Karaoke",
    description:
      "Progressive word illumination. Full phrase visible in muted opacity; words illuminate brightly with gold accent as spoken.",
    badge: "Word-Synced",
    requiresWordTimings: true,
    settings: {
      preset: "karaoke",
      entrance_animation: "fade",
      exit_animation: "fade",
      word_animation: "highlight",
      intensity: "medium",
      active_word_style: "highlight",
      font_weight: "bold",
      primary_color: "rgba(255, 255, 255, 0.45)",
      active_color: "#FACC15", // Yellow-400
      active_bg_color: "transparent",
      respect_reduced_motion: true,
    },
  },
  bold_bounce: {
    id: "bold_bounce",
    name: "Bold Bounce",
    description:
      "High-energy kinetic bounce with punchy spring entrance. Active words scale up with extra weight.",
    badge: "Dynamic",
    requiresWordTimings: false,
    settings: {
      preset: "bold_bounce",
      entrance_animation: "pop",
      exit_animation: "slide_down",
      word_animation: "emphasis",
      intensity: "high",
      active_word_style: "scale",
      font_weight: "black",
      primary_color: "#FFFFFF",
      active_color: "#A855F7", // Purple-400
      active_bg_color: "rgba(168, 85, 247, 0.25)",
      respect_reduced_motion: true,
    },
  },
  minimal_fade: {
    id: "minimal_fade",
    name: "Minimal Fade",
    description:
      "Subtle, cinematic documentary presentation. Soft opacity transitions without positional jumping.",
    badge: "Cinematic",
    requiresWordTimings: false,
    settings: {
      preset: "minimal_fade",
      entrance_animation: "fade",
      exit_animation: "fade",
      word_animation: "none",
      intensity: "low",
      active_word_style: "bold",
      font_weight: "normal",
      primary_color: "#FFFFFF",
      active_color: "#FFFFFF",
      active_bg_color: "transparent",
      respect_reduced_motion: true,
    },
  },
  punchy: {
    id: "punchy",
    name: "Punchy",
    description:
      "High contrast impact. Heavy black typography with vibrant neon yellow highlight box on active words.",
    badge: "High Energy",
    requiresWordTimings: false,
    settings: {
      preset: "punchy",
      entrance_animation: "slide_up",
      exit_animation: "fade",
      word_animation: "pop",
      intensity: "high",
      active_word_style: "highlight",
      font_weight: "black",
      primary_color: "#FFFFFF",
      active_color: "#FBBF24", // Amber-400
      active_bg_color: "rgba(251, 191, 36, 0.3)",
      respect_reduced_motion: true,
    },
  },
  hormozi: {
    id: "hormozi",
    name: "Hormozi Viral",
    description:
      "Signature short-form creator style. Extra-bold typography with punchy spring scaling and vivid emerald-green highlight box.",
    badge: "Viral Creator",
    requiresWordTimings: false,
    settings: {
      preset: "hormozi",
      entrance_animation: "pop",
      exit_animation: "fade",
      word_animation: "pop",
      intensity: "high",
      active_word_style: "scale",
      font_weight: "black",
      primary_color: "#FFFFFF",
      active_color: "#22C55E", // Emerald-500
      active_bg_color: "rgba(34, 197, 94, 0.35)",
      respect_reduced_motion: true,
    },
  },
  neon_pulse: {
    id: "neon_pulse",
    name: "Neon Cyber",
    description:
      "Luminous futuristic aesthetic. High-tech electric cyan glowing text and soft pulsating illumination.",
    badge: "Luminous Glow",
    requiresWordTimings: false,
    settings: {
      preset: "neon_pulse",
      entrance_animation: "fade",
      exit_animation: "fade",
      word_animation: "highlight",
      intensity: "high",
      active_word_style: "highlight",
      font_weight: "bold",
      primary_color: "#FFFFFF",
      active_color: "#00F0FF", // Electric Cyan
      active_bg_color: "rgba(0, 240, 255, 0.3)",
      respect_reduced_motion: true,
    },
  },
  editorial: {
    id: "editorial",
    name: "Editorial Reel",
    description:
      "Sophisticated documentary presentation. Smooth slide entrance with refined slate accents and subtle contrast.",
    badge: "Documentary",
    requiresWordTimings: false,
    settings: {
      preset: "editorial",
      entrance_animation: "slide_up",
      exit_animation: "fade",
      word_animation: "emphasis",
      intensity: "low",
      active_word_style: "bold",
      font_weight: "bold",
      primary_color: "#F8FAFC",
      active_color: "#CBD5E1", // Slate-300
      active_bg_color: "rgba(203, 213, 225, 0.15)",
      respect_reduced_motion: true,
    },
  },
};

export const DEFAULT_MOTION_SETTINGS: MotionCaptionSettings = {
  preset: "clean_pop",
  entrance_animation: "pop",
  exit_animation: "fade",
  word_animation: "pop",
  intensity: "medium",
  active_word_style: "highlight",
  font_weight: "bold",
  primary_color: "#FFFFFF",
  active_color: "#22D3EE",
  active_bg_color: "rgba(34, 211, 238, 0.2)",
  respect_reduced_motion: true,
};
