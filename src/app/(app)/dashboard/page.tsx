import { DashboardOverview } from "@/components/dashboard-overview";
import { getDashboardWorkspace } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const workspace = await getDashboardWorkspace(user.id);

  return <DashboardOverview workspace={workspace} />;
}
