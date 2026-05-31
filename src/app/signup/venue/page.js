import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Wedding Venue",
  description: "Pick or describe your wedding venue so MyShaadiStore can match the right décor, catering and photography vendors near your location.",
};

export default function SignupVenuePage() {
  return <SignupWizard step="venue" />;
}

