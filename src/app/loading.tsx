import { PageLoader } from "@/components/feedback/page-loader";

export default function RootLoading() {
  return (
    <PageLoader
      variant="fullscreen"
      label="Opening…"
      hint="Loading Hotel PMS"
    />
  );
}
