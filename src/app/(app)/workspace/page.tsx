import type { Metadata } from "next";
import { WorkspaceEditorPage } from "@/components/pages/WorkspaceEditorPage";

export const metadata: Metadata = { title: "Workspace" };

export default function Page() {
  return <WorkspaceEditorPage />;
}
