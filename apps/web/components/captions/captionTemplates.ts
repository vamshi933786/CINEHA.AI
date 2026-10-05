import {
  CaptionTemplate,
  CaptionAppearanceSettings,
  MotionCaptionSettings,
} from "@/types/caption";

export const CAPTION_TEMPLATES: CaptionTemplate[] = [
  {
    id: "clean",
    name: "Clean Classic",
    category: "Clean & Minimal",
    description:
      "Crisp white typography with soft dark drop shadow. No distracting background box—the industry standard for modern reels.",
    badge: "Most Popular",
    preset: "clean_pop",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "bold",
      fontSize: "medium",
      textTransform: "none",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#38BDF8", // Sky-400
      secondary: "#94A3B8",
    },
    background: {
      type: "none",
      color: "transparent",
      opacity: 0,
      radius: 0,
    },
    shadow: {
      enabled: true,
      blur: 8,
      opacity: 0.95,
      color: "rgba(0, 0, 0, 0.95)",
    },
    outline: {
      enabled: true,
      width: 1.5,
      color: "rgba(0, 0, 0, 0.85)",
    },
    position: {
      x: 0.5,
      y: 0.82,
    },
    alignment: "center",
    animation: {
      entrance: "pop",
      exit: "fade",
      wordAnimation: "pop",
      intensity: "medium",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "సినిమాటిక్ కెమెరా సెట్టింగ్స్!",
    englishPreview: "Stop shooting at 60fps!",
  },
  {
    id: "hormozi",
    name: "Hormozi Viral",
    category: "Viral Creator",
    description:
      "Signature high-energy creator style. Extra-bold uppercase, punchy scale pop, and vibrant emerald-green highlight box.",
    badge: "Viral Creator",
    preset: "hormozi",
    typography: {
      fontFamily: "Montserrat, system-ui, sans-serif",
      fontWeight: "black",
      fontSize: "large",
      textTransform: "uppercase",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#10B981", // Emerald-500
      background: "rgba(0, 0, 0, 0.92)",
    },
    background: {
      type: "solid",
      color: "rgba(0, 0, 0, 0.92)",
      opacity: 0.95,
      radius: 14,
      padding: "px-4 py-2.5",
    },
    shadow: {
      enabled: true,
      blur: 14,
      opacity: 0.8,
      color: "rgba(0, 0, 0, 0.85)",
    },
    outline: {
      enabled: true,
      width: 2,
      color: "rgba(16, 185, 129, 0.4)",
    },
    position: {
      x: 0.5,
      y: 0.78,
    },
    alignment: "center",
    animation: {
      entrance: "pop",
      exit: "fade",
      wordAnimation: "pop",
      intensity: "high",
    },
    activeWordStyle: "scale",
    safeArea: false,
    teluguPreview: "వైరల్ క్రియేటర్ రీల్స్",
    englishPreview: "VIRAL REELS SECRET",
  },
  {
    id: "viral_pop",
    name: "Viral Pop",
    category: "Viral Creator",
    description:
      "Snappy word pop with vivid electric cyan highlights and subtle translucent blur. Built for maximum watch time.",
    badge: "High Retention",
    preset: "viral_pop",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "black",
      fontSize: "medium",
      textTransform: "none",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#06B6D4", // Cyan-500
      secondary: "#E0F2FE",
    },
    background: {
      type: "translucent",
      color: "rgba(0, 0, 0, 0.45)",
      opacity: 0.45,
      radius: 16,
      padding: "px-3.5 py-1.5",
    },
    shadow: {
      enabled: true,
      blur: 8,
      opacity: 0.9,
      color: "rgba(0, 0, 0, 0.9)",
    },
    outline: {
      enabled: true,
      width: 2,
      color: "rgba(0, 0, 0, 0.85)",
    },
    position: {
      x: 0.5,
      y: 0.8,
    },
    alignment: "center",
    animation: {
      entrance: "pop",
      exit: "fade",
      wordAnimation: "pop",
      intensity: "high",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "వైరల్ రీల్స్ సీక్రెట్!",
    englishPreview: "Watch this till the end!",
  },
  {
    id: "karaoke",
    name: "Karaoke Sync",
    category: "Modern Sync",
    description:
      "Progressive word illumination. Full phrase visible in muted opacity; spoken words light up with brilliant gold.",
    badge: "Word-Synced",
    preset: "karaoke",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "bold",
      fontSize: "medium",
      textTransform: "none",
    },
    colors: {
      text: "rgba(255, 255, 255, 0.45)",
      activeWord: "#FACC15", // Yellow-400
      secondary: "#FDE047",
    },
    background: {
      type: "none",
      color: "transparent",
      opacity: 0,
      radius: 0,
    },
    shadow: {
      enabled: true,
      blur: 6,
      opacity: 0.9,
      color: "rgba(0, 0, 0, 0.95)",
    },
    outline: {
      enabled: true,
      width: 1.5,
      color: "rgba(0, 0, 0, 0.9)",
    },
    position: {
      x: 0.5,
      y: 0.82,
    },
    alignment: "center",
    animation: {
      entrance: "fade",
      exit: "fade",
      wordAnimation: "highlight",
      intensity: "medium",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "ప్రతి పదం సింక్ అవుతుంది",
    englishPreview: "Synchronized word by word",
  },
  {
    id: "neon",
    name: "Neon Cyber",
    category: "High Impact",
    description:
      "Futuristic electric cyan aura with luminous drop shadows and bold edge glow for tech, gaming, and nightlife reels.",
    badge: "Luminous Glow",
    preset: "neon_pulse",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "black",
      fontSize: "medium",
      textTransform: "none",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#00F0FF",
      secondary: "#A5F3FC",
    },
    background: {
      type: "outline",
      color: "transparent",
      opacity: 0,
      radius: 12,
    },
    shadow: {
      enabled: true,
      blur: 16,
      opacity: 0.95,
      color: "rgba(0, 240, 255, 0.65)",
    },
    outline: {
      enabled: true,
      width: 2,
      color: "rgba(0, 240, 255, 0.8)",
    },
    position: {
      x: 0.5,
      y: 0.8,
    },
    alignment: "center",
    animation: {
      entrance: "fade",
      exit: "fade",
      wordAnimation: "highlight",
      intensity: "high",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "నియాన్ సైబర్ స్టైల్",
    englishPreview: "Neon Cyber Edition",
  },
  {
    id: "editorial",
    name: "Editorial Reel",
    category: "Clean & Minimal",
    description:
      "Sophisticated documentary presentation with refined slate framing, clean border accents, and smooth slide entrance.",
    badge: "Documentary",
    preset: "editorial",
    typography: {
      fontFamily: "Georgia, Cambria, serif",
      fontWeight: "bold",
      fontSize: "small",
      textTransform: "none",
    },
    colors: {
      text: "#F8FAFC",
      activeWord: "#CBD5E1",
      secondary: "#94A3B8",
    },
    background: {
      type: "translucent",
      color: "rgba(15, 23, 42, 0.8)",
      opacity: 0.8,
      radius: 10,
      padding: "px-4 py-2",
    },
    shadow: {
      enabled: true,
      blur: 8,
      opacity: 0.6,
      color: "rgba(0, 0, 0, 0.7)",
    },
    outline: {
      enabled: true,
      width: 1,
      color: "rgba(100, 116, 139, 0.4)",
    },
    position: {
      x: 0.5,
      y: 0.85,
    },
    alignment: "center",
    animation: {
      entrance: "slide_up",
      exit: "fade",
      wordAnimation: "emphasis",
      intensity: "low",
    },
    activeWordStyle: "bold",
    safeArea: false,
    teluguPreview: "డాక్యుమెంటరీ ఎడిటోరియల్",
    englishPreview: "Documentary Reel Series",
  },
  {
    id: "minimal",
    name: "Minimal Cinema",
    category: "Clean & Minimal",
    description:
      "Soft cinematic transitions without positional jumps. Understated, refined, and non-intrusive.",
    badge: "Cinematic",
    preset: "minimal_fade",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "normal",
      fontSize: "medium",
      textTransform: "none",
    },
    colors: {
      text: "#F8FAFC",
      activeWord: "#FFFFFF",
      secondary: "#E2E8F0",
    },
    background: {
      type: "none",
      color: "transparent",
      opacity: 0,
      radius: 0,
    },
    shadow: {
      enabled: true,
      blur: 4,
      opacity: 0.8,
      color: "rgba(0, 0, 0, 0.9)",
    },
    outline: {
      enabled: false,
      width: 0,
      color: "transparent",
    },
    position: {
      x: 0.5,
      y: 0.84,
    },
    alignment: "center",
    animation: {
      entrance: "fade",
      exit: "fade",
      wordAnimation: "none",
      intensity: "low",
    },
    activeWordStyle: "off",
    safeArea: false,
    teluguPreview: "సహజమైన సినిమాటిక్ లుక్",
    englishPreview: "Subtle Cinema Setting",
  },
  {
    id: "dynamic",
    name: "Dynamic Bounce",
    category: "Viral Creator",
    description:
      "Playful spring bounce with vivid violet pill accents. Words pop with spring energy for comedy and lifestyle creators.",
    badge: "Dynamic Energy",
    preset: "bold_bounce",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "black",
      fontSize: "large",
      textTransform: "none",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#A855F7", // Purple-500
      secondary: "#E9D5FF",
    },
    background: {
      type: "pill",
      color: "rgba(88, 28, 135, 0.45)",
      opacity: 0.5,
      radius: 20,
      padding: "px-4 py-1.5",
    },
    shadow: {
      enabled: true,
      blur: 10,
      opacity: 0.85,
      color: "rgba(0, 0, 0, 0.85)",
    },
    outline: {
      enabled: true,
      width: 1.5,
      color: "rgba(168, 85, 247, 0.4)",
    },
    position: {
      x: 0.5,
      y: 0.78,
    },
    alignment: "center",
    animation: {
      entrance: "pop",
      exit: "slide_down",
      wordAnimation: "emphasis",
      intensity: "high",
    },
    activeWordStyle: "scale",
    safeArea: false,
    teluguPreview: "డైనమిక్ బౌన్స్ యానిమేషన్",
    englishPreview: "High energy bounce pop",
  },
  {
    id: "punch",
    name: "Punchy Impact",
    category: "High Impact",
    description:
      "Maximum contrast punch. Heavy black typography with neon amber/yellow badge highlight for bold hook statements.",
    badge: "High Impact",
    preset: "punchy",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "black",
      fontSize: "large",
      textTransform: "uppercase",
    },
    colors: {
      text: "#FFFFFF",
      activeWord: "#FBBF24", // Amber-400
      secondary: "#FEF08A",
    },
    background: {
      type: "highlight",
      color: "rgba(0, 0, 0, 0.85)",
      opacity: 0.85,
      radius: 12,
      padding: "px-4 py-2",
    },
    shadow: {
      enabled: true,
      blur: 8,
      opacity: 0.9,
      color: "rgba(0, 0, 0, 0.95)",
    },
    outline: {
      enabled: true,
      width: 2,
      color: "rgba(251, 191, 36, 0.5)",
    },
    position: {
      x: 0.5,
      y: 0.8,
    },
    alignment: "center",
    animation: {
      entrance: "slide_up",
      exit: "fade",
      wordAnimation: "pop",
      intensity: "high",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "హై ఇంపాక్ట్ పవర్ టైటిల్స్",
    englishPreview: "MAXIMUM HOOK IMPACT",
  },
  {
    id: "cinematic",
    name: "Cinematic Gold",
    category: "Cinematic",
    description:
      "Subtle letter-spaced luxury framing with rich champagne gold highlights and dramatic slow dissolution.",
    badge: "Cinema Luxury",
    preset: "cinematic",
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "bold",
      fontSize: "medium",
      letterSpacing: 0.05,
      textTransform: "none",
    },
    colors: {
      text: "#FDFBF7",
      activeWord: "#F59E0B", // Amber-500 gold
      secondary: "#D97706",
    },
    background: {
      type: "gradient",
      color: "rgba(0, 0, 0, 0.55)",
      opacity: 0.6,
      radius: 12,
      padding: "px-4 py-2",
    },
    shadow: {
      enabled: true,
      blur: 10,
      opacity: 0.9,
      color: "rgba(0, 0, 0, 0.95)",
    },
    outline: {
      enabled: true,
      width: 1,
      color: "rgba(245, 158, 11, 0.35)",
    },
    position: {
      x: 0.5,
      y: 0.82,
    },
    alignment: "center",
    animation: {
      entrance: "fade",
      exit: "fade",
      wordAnimation: "highlight",
      intensity: "low",
    },
    activeWordStyle: "highlight",
    safeArea: false,
    teluguPreview: "సినిమాటిక్ గోల్డ్ ఫ్రేమ్",
    englishPreview: "Cinematic Gold Standard",
  },
];

export const DEFAULT_TEMPLATE: CaptionTemplate = CAPTION_TEMPLATES[0];

export function getTemplateById(id: string): CaptionTemplate {
  return CAPTION_TEMPLATES.find((t) => t.id === id) || DEFAULT_TEMPLATE;
}

export function templateToAppearance(
  template: CaptionTemplate,
  prevAppearance?: Partial<CaptionAppearanceSettings>,
  preservePosition: boolean = false
): CaptionAppearanceSettings {
  const bgType: "none" | "box" | "outline" =
    template.background.type === "none"
      ? "none"
      : template.background.type === "outline"
      ? "outline"
      : "box";

  return {
    alignment:
      preservePosition && prevAppearance?.alignment
        ? prevAppearance.alignment
        : template.alignment,
    vertical_position: "custom",
    position_x:
      preservePosition && prevAppearance?.position_x !== undefined
        ? prevAppearance.position_x
        : template.position.x,
    position_y:
      preservePosition && prevAppearance?.position_y !== undefined
        ? prevAppearance.position_y
        : template.position.y,
    font_size: template.typography.fontSize,
    background: bgType,
    show_safe_area: prevAppearance?.show_safe_area ?? template.safeArea,
  };
}

export function templateToMotionSettings(
  template: CaptionTemplate,
  respectReducedMotion = true
): MotionCaptionSettings {
  return {
    preset: template.preset,
    entrance_animation: template.animation.entrance,
    exit_animation: template.animation.exit,
    word_animation: template.animation.wordAnimation,
    intensity: template.animation.intensity,
    active_word_style: template.activeWordStyle || "highlight",
    font_weight: template.typography.fontWeight,
    primary_color: template.colors.text,
    active_color: template.colors.activeWord || "#38BDF8",
    active_bg_color: template.background.color || "rgba(56, 189, 248, 0.2)",
    respect_reduced_motion: respectReducedMotion,
  };
}
