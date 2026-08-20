import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function KnowledgePage() {
  return <PageScaffold config={routeContent.knowledge} />;
}
