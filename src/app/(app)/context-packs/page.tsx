import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function ContextPacksPage() {
  return <PageScaffold config={routeContent.contextPacks} />;
}
