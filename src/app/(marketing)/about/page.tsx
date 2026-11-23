import type { Metadata } from "next";
import { AboutPage } from "@/components/marketing/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description: "Purpose, engineering approach, scope and roadmap of ArchOpt.",
};

export default function Page() {
  return <AboutPage />;
}
