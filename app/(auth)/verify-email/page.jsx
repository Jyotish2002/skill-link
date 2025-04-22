import VerifyEmailPage from "@/components/VerifyEmailPage";
import { Suspense } from "react";
export default function ResetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
