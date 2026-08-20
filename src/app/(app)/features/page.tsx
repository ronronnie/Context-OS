import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function FeaturesPage() {
  return <PageScaffold config={routeContent.features} />;
}
