import type { LucideIcon } from "lucide-react";

export type MemoryStatus =
  | "current"
  | "active"
  | "verified"
  | "needs_review"
  | "draft"
  | "proposed"
  | "superseded"
  | "exported"
  | "planned"
  | "deprecated"
  | "archived"
  | "outdated"
  | "rejected";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type RouteSection = {
  title: string;
  description: string;
  status: MemoryStatus;
  chips: string[];
};

export type RouteContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  emptyTitle: string;
  emptyDescription: string;
  sections: RouteSection[];
};
