import type { Metadata } from "next";
import { OptimizationPage } from "@/components/pages/OptimizationPage";

export const metadata: Metadata = { title: "Optimization" };

export default function Page() {
  return <OptimizationPage />;
}
