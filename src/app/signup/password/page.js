import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Set Password | MyShaadiStore",
};

export default function SignupPasswordPage() {
  return <SignupWizard step="password" />;
}
