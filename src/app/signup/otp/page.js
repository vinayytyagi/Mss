import { redirect } from "next/navigation";

export const metadata = {
  title: "Verify OTP",
  description: "Verify your mobile number with a one-time password to secure your MyShaadiStore account and continue your wedding planning.",
  robots: { index: false, follow: false },
};

export default function SignupOtpPage() {
  redirect("/signup");
}
