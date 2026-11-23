import type { Metadata } from "next";
import { SpacePlannerPage } from "@/components/pages/SpacePlannerPage";

export const metadata: Metadata = { title: "Space Planner" };

export default function Page() {
  return <SpacePlannerPage />;
}
