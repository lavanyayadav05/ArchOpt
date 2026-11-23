import type { Metadata } from "next";
import { LayoutsPage } from "@/components/pages/LayoutsPage";

export const metadata: Metadata = { title: "Layouts" };

export default function Page() {
  return <LayoutsPage />;
}
