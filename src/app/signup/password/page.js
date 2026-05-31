import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Set Password",
  description: "Create a secure password for your MyShaadiStore account to save your wedding plan and access it on any device.",
};

export default function SignupPasswordPage() {
  return <SignupWizard step="password" />;
}
