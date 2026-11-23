import type { Metadata } from "next";
import { VersionsPage } from "@/components/pages/VersionsPage";

export const metadata: Metadata = { title: "Versions" };

export default function Page() {
  return <VersionsPage />;
}
