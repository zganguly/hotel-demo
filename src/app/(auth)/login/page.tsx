import { Suspense } from "react";
import LoginPage from "./login-page";

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
