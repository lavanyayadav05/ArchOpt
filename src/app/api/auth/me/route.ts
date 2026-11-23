import { currentUser } from "@/server/auth";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  return json({ user: user ? { name: user.name, email: user.email, organization: user.organization } : null });
}
