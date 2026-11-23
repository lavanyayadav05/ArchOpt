import type { Metadata } from "next";
import { WorkflowPage } from "@/components/marketing/WorkflowPage";

export const metadata: Metadata = {
  title: "Workflow",
  description: "The seven-stage ArchOpt pipeline from requirements to visualization.",
};

export default function Page() {
  return <WorkflowPage />;
}
