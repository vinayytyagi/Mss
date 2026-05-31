import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Engagement",
  description: "Tell MyShaadiStore when you got engaged so we can time your wedding planning checklist correctly — venues, vendors and shopping.",
};

export default function SignupEngagedPage() {
  return <SignupWizard step="engaged" />;
}

