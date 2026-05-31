import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Wedding Budget",
  description: "Set your wedding budget and MyShaadiStore will allocate it intelligently across every category — venue, catering, photography, décor and more.",
};

export default function SignupBudgetPage() {
  return <SignupWizard step="budget" />;
}
