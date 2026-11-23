import type { Room, Plot, AdjacencyEdge } from "@/lib/types";

/**
 * Lightweight client-side geometry helpers.
 *
 * Rectangle geometry used by the engine and by the editor: intersection,
 * boundary validation and minimum dimensions, so the interface can give
 * immediate feedback while a layout is being edited.
 */

export interface ConstraintViolation {
  code: "overlap" | "boundary" | "min-dimension" | "area";
  roomIds: string[];
  message: string;
}

export function roomArea(room: Pick<Room, "width" | "height">): number {
  return room.width * room.height;
}

export function rectsIntersect(a: Room, b: Room): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function insidePlot(room: Room, plot: Plot): boolean {
  return (
    room.x >= 0 &&
    room.y >= 0 &&
    room.x + room.width <= plot.width &&
    room.y + room.height <= plot.height
  );
}

export function checkConstraints(rooms: Room[], plot: Plot): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (let i = 0; i < rooms.length; i += 1) {
    const a = rooms[i];
    if (!insidePlot(a, plot)) {
      violations.push({
        code: "boundary",
        roomIds: [a.id],
        message: `${a.name} extends beyond the ${plot.width} m × ${plot.height} m plot boundary.`,
      });
    }
    if (a.minWidth && a.width < a.minWidth) {
      violations.push({
        code: "min-dimension",
        roomIds: [a.id],
        message: `${a.name} is narrower than its minimum width (${a.minWidth} m).`,
      });
    }
    if (a.minHeight && a.height < a.minHeight) {
      violations.push({
        code: "min-dimension",
        roomIds: [a.id],
        message: `${a.name} is shorter than its minimum depth (${a.minHeight} m).`,
      });
    }
    if (a.requiredArea && roomArea(a) < a.requiredArea) {
      violations.push({
        code: "area",
        roomIds: [a.id],
        message: `${a.name} is below its required area (${a.requiredArea} m²).`,
      });
    }
    for (let j = i + 1; j < rooms.length; j += 1) {
      const b = rooms[j];
      if (rectsIntersect(a, b)) {
        violations.push({
          code: "overlap",
          roomIds: [a.id, b.id],
          message: `${a.name} overlaps ${b.name}.`,
        });
      }
    }
  }
  return violations;
}

export function totalRoomArea(rooms: Room[]): number {
  return rooms.reduce((sum, r) => sum + roomArea(r), 0);
}

export function usableArea(rooms: Room[]): number {
  return rooms
    .filter((r) => r.type !== "circulation" && r.type !== "corridor")
    .reduce((sum, r) => sum + roomArea(r), 0);
}

export function circulationArea(rooms: Room[]): number {
  return rooms
    .filter((r) => r.type === "circulation" || r.type === "corridor")
    .reduce((sum, r) => sum + roomArea(r), 0);
}

/** Usable area / total built area, as a percentage. */
export function areaEfficiency(rooms: Room[]): number {
  const total = totalRoomArea(rooms);
  if (total === 0) return 0;
  return Math.round((usableArea(rooms) / total) * 100);
}

export function roomCentre(room: Room): { x: number; y: number } {
  return { x: room.x + room.width / 2, y: room.y + room.height / 2 };
}

/** Rooms sharing an edge (touching) are considered adjacent. */
export function roomsTouch(a: Room, b: Room, tolerance = 0.01): boolean {
  const horizontalOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
  const verticalOverlap = a.y < b.y + b.height && a.y + a.height > b.y;
  const shareVerticalEdge =
    (Math.abs(a.x + a.width - b.x) < tolerance || Math.abs(b.x + b.width - a.x) < tolerance) &&
    verticalOverlap;
  const shareHorizontalEdge =
    (Math.abs(a.y + a.height - b.y) < tolerance || Math.abs(b.y + b.height - a.y) < tolerance) &&
    horizontalOverlap;
  return shareVerticalEdge || shareHorizontalEdge;
}

/** Share (0–100) of weighted adjacency preferences satisfied by touching rooms. */
export function adjacencySatisfaction(rooms: Room[], edges: AdjacencyEdge[]): number {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  let total = 0;
  let satisfied = 0;
  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    total += e.weight;
    if (roomsTouch(a, b)) satisfied += e.weight;
  }
  return total === 0 ? 0 : Math.round((satisfied / total) * 100);
}
