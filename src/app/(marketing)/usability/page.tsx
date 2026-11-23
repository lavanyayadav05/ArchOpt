import type { Metadata } from "next";
import { UsabilityPage } from "@/components/marketing/UsabilityPage";

export const metadata: Metadata = {
  title: "Usability & Design",
  description: "Users, usability heuristics, accessibility decisions and an evaluation toolkit for ArchOpt.",
};

export default function Page() {
  return <UsabilityPage />;
}
