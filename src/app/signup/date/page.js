import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Wedding Date",
  description: "Set your wedding date to unlock a personalised vendor timeline — booking deadlines for venue, catering, photography, décor and more.",
};

export default function SignupDatePage() {
  return <SignupWizard step="date" />;
}

