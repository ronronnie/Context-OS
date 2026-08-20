import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function ModulesPage() {
  return <PageScaffold config={routeContent.modules} />;
}
