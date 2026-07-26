import { PageLoader } from "@/components/feedback/page-loader";

export default function PropertyLoading() {
  return (
    <PageLoader
      variant="fullscreen"
      label="Opening…"
      hint="Loading reservations, rooms, and desk data"
    />
  );
}
