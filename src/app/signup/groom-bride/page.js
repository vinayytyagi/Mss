import SignupWizard from "@/components/SignupWizard";

export const metadata = {
  title: "Groom or Bride",
  description: "Tell us if you're the groom or the bride so MyShaadiStore can tailor your outfit ideas, jewellery picks and shopping recommendations.",
};

export default function SignupGroomBridePage() {
  return <SignupWizard step="groom-bride" />;
}

