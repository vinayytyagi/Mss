import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Sign Up",
  description: "Create your free MyShaadiStore account — set your wedding date, venue and budget to get a personalised vendor checklist and quotations in minutes.",
};

export default async function SignupPage() {
  return (
    <SignupWizard step="signup" />
  );
}
