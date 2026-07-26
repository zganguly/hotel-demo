import { PageLoader } from "@/components/feedback/page-loader";

export default function AuthLoading() {
  return (
    <PageLoader
      variant="fullscreen"
      label="Opening…"
      hint="Preparing the night desk"
    />
  );
}
