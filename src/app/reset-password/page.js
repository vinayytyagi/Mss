import { Suspense } from "react";
import ResetPasswordClient from "@/components/ResetPasswordClient";

export const metadata = {
  title: "Reset password",
  description: "Set a new password for your MyShaadiStore account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
