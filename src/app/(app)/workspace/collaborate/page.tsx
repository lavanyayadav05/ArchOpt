import type { Metadata } from "next";
import { CollaboratePage } from "@/components/pages/CollaboratePage";

export const metadata: Metadata = { title: "Collaborate" };

export default function Page() {
  return <CollaboratePage />;
}
