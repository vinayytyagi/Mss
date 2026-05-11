import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign Up | MyShaadiStore",
};

export default function SignupOtpPage() {
  redirect("/signup");
}
