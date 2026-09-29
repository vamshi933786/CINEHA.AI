import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BarChart2,
  GitCompare,
  TrendingUp,
  Video,
  Calendar,
  User,
  Settings,
  Network,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  phase?: string;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Creator command center and overview",
  },
  {
    label: "Script Studio",
    href: "/scripts",
    icon: FileText,
    description: "2-column screenplay generation (VO + Visual)",
    badge: "Phase 6",
  },
  {
    label: "Hook Generator",
    href: "/hooks",
    icon: Sparkles,
    description: "9-taxonomy high-retention openings",
    badge: "Phase 5",
  },
  {
    label: "Retention Analyzer",
    href: "/analyzer",
    icon: BarChart2,
    description: "Pacing, retention & drop-off heuristic scoring",
    badge: "Phase 7",
  },
  {
    label: "Script Optimizer",
    href: "/optimizer",
    icon: GitCompare,
    description: "Side-by-side diff studio & script rewriting",
    badge: "Phase 7",
  },
  {
    label: "3D Workflow",
    href: "/workflow",
    icon: Network,
    description: "Interactive multi-agent orchestration pipeline",
    badge: "Phase 8",
  },
  {
    label: "Trend Research",
    href: "/research",
    icon: TrendingUp,
    description: "Short-form patterns with citation tracking",
    badge: "Phase 10",
  },
  {
    label: "Video Analysis",
    href: "/video-analysis",
    icon: Video,
    description: "Video audit & Video → Script engine",
    badge: "100 MB",
  },
  {
    label: "Content Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Kanban & publishing timeline planning",
    badge: "Phase 12",
  },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    label: "Creator Profile",
    href: "/profile",
    icon: User,
    description: "Persona, tone & language settings",
    badge: "Phase 4",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "API keys, models & workspace configuration",
  },
];
