import type { Metadata } from "next";
import { DesignLabPage } from "@/components/pages/design-lab/DesignLabPage";

export const metadata: Metadata = { title: "Design Lab" };

export default function Page() {
  return <DesignLabPage />;
}
