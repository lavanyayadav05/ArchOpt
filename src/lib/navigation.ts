import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderOpen,
  LayoutGrid,
  Layers,
  Map,
  BarChart3,
  PanelsTopLeft,
  Palette,
  Users,
  Settings,
  MousePointer2,
  UsersRound,
  History,
  Boxes,
  Box,
  Camera,
  Sun,
  Building2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

/** Sidebar navigation. Order and labels match the reference screenshots. */
export const appNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Space Planner", href: "/space-planner", icon: LayoutGrid },
  { label: "Optimization", href: "/optimization", icon: Layers },
  { label: "Layouts", href: "/layouts", icon: Map },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  {
    label: "Workspace",
    href: "/workspace",
    icon: PanelsTopLeft,
    children: [
      { label: "Editor", href: "/workspace", icon: MousePointer2 },
      { label: "Collaborate", href: "/workspace/collaborate", icon: UsersRound },
      { label: "Versions", href: "/workspace/versions", icon: History },
    ],
  },
  {
    label: "Design Lab",
    href: "/design-lab",
    icon: Palette,
    children: [
      { label: "Materials", href: "/design-lab?tab=materials", icon: Boxes },
      { label: "3D Views", href: "/design-lab?tab=3d", icon: Box },
      { label: "Render Studio", href: "/design-lab?tab=render", icon: Camera },
      { label: "Lighting", href: "/design-lab?tab=lighting", icon: Sun },
      { label: "Facade", href: "/design-lab?tab=facade", icon: Building2 },
    ],
  },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const marketingNav = [
  { label: "Features", href: "/features" },
  { label: "Workflow", href: "/workflow" },
  { label: "Technology", href: "/technology" },
  { label: "Usability", href: "/usability" },
  { label: "About", href: "/about" },
];
