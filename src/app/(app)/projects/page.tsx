import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsPage } from "@/components/pages/ProjectsPage";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProjectsPage />
    </Suspense>
  );
}
