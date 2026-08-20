import { PageScaffold } from "@/components/page-scaffold";
import { routeContent } from "@/lib/app-data";

export default function SettingsPage() {
  return <PageScaffold config={routeContent.settings} />;
}
