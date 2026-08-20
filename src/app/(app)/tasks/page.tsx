import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function TasksPage() {
  return <PageScaffold config={routeContent.tasks} />;
}
