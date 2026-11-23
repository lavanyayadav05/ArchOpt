import type { Metadata } from "next";
import { FeaturesPage } from "@/components/marketing/FeaturesPage";

export const metadata: Metadata = {
  title: "Features",
  description: "Space planning, adjacency graphs, circulation analysis, area efficiency, accessibility and layout optimization.",
};

export default function Page() {
  return <FeaturesPage />;
}
