import type { Metadata } from "next";
import { TechnologyPage } from "@/components/marketing/TechnologyPage";

export const metadata: Metadata = {
  title: "Technology",
  description: "Next.js, React and TypeScript with an in-browser optimization engine.",
};

export default function Page() {
  return <TechnologyPage />;
}
