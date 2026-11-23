import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";

export const metadata: Metadata = {
  title: "ArchOpt — Intelligent Architectural Space & Circulation Optimizer",
};

export default function Home() {
  return <LandingPage />;
}
