"use client";

import { MoreHorizontal, Ruler, LayoutGrid, Map } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DropdownMenu, type MenuItem } from "@/components/ui/Dropdown";
import { FloorPlan } from "@/components/floorplan/FloorPlan";
import { getLayout, layoutARooms, layoutBRooms, layoutCRooms, layoutDRooms } from "@/lib/mock";
import type { Project } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

/** Pick the rooms to draw in a project's thumbnail (sample data). */
export function projectRooms(project: Project, index = 0) {
  const first = project.layoutIds[0];
  const layout = first ? getLayout(first) : undefined;
  if (layout) return layout.rooms;
  if (project.layoutIds.length === 0) return null;
  return [layoutARooms, layoutBRooms, layoutCRooms, layoutDRooms][index % 4];
}

export function ProjectThumbnail({ project, index = 0, className }: { project: Project; index?: number; className?: string }) {
  const rooms = projectRooms(project, index);
  return (
    <div className={cn("flex items-center justify-center border border-line bg-bg p-2 rounded-sm", className)}>
      {rooms ? (
        <FloorPlan plot={{ width: 30, height: 20 }} rooms={rooms} thumbnail className="max-h-full" ariaLabel={`${project.name} layout thumbnail`} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-line-strong text-center">
          <Map className="mb-1 h-4 w-4 text-muted" aria-hidden />
          <span className="text-[11px] text-muted">No layout yet</span>
        </div>
      )}
    </div>
  );
}

export interface ProjectCardProps {
  project: Project;
  index?: number;
  menu: MenuItem[];
  className?: string;
}

export function ProjectCard({ project, index = 0, menu, className }: ProjectCardProps) {
  return (
    <Card interactive className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-3">
        <ProjectThumbnail project={project} index={index} className="h-[88px] w-full" />
        <DropdownMenu
          trigger={({ ref, toggle, ...aria }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-label={`Actions for ${project.name}`}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-line text-muted rounded-xs hover:bg-highlight hover:text-ink"
              {...aria}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
          items={menu}
        />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold text-ink">{project.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" aria-hidden /> {project.plot.width} m × {project.plot.height} m
          </span>
          <span className="inline-flex items-center gap-1">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> {project.spaces} Spaces
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <StatusBadge status={project.status} />
        <span className="text-xs text-muted">{formatDate(project.updatedAt)}</span>
      </div>
    </Card>
  );
}
