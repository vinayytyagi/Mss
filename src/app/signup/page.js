import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Sign Up | MyShaadiStore",
  description: "Create your account and start your wedding planning journey.",
};

export default async function SignupPage() {
  return (
    <SignupWizard step="signup" />
  );
}
