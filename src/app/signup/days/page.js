import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Function Days",
  description: "Tell us how many wedding functions you're planning — haldi, mehndi, sangeet, ceremony, reception — so vendors can quote multi-day packages.",
};

export default function SignupDaysPage() {
  return <SignupWizard step="days" />;
}

