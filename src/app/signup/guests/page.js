import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Guest Count",
  description: "Share your expected guest count — we use it to scale every quotation: catering plates, invitations, return gifts and seating capacity.",
};

export default function SignupGuestsPage() {
  return <SignupWizard step="guests" />;
}

