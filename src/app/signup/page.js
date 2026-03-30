import SignupPageServer from "@/components/server/SignupPageServer";

export const metadata = {
  title: "Sign Up | MyShaadiStore",
  description: "Create your account and start your wedding planning journey.",
};

export default async function SignupPage() {
  return (
    <SignupPageServer />
  );
}
