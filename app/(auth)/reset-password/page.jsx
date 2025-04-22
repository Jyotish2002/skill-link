import ResetPasswordForm from "@/components/ResetPasswordForm";
import { Suspense } from "react";
export default function ResetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
