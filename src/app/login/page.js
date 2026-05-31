import LoginPageServer from "@/components/server/LoginPageServer";

export const metadata = {
  title: "Login",
  description: "Sign in to MyShaadiStore to access your wedding planning journey, saved vendors, quotations, orders and personalised dashboard.",
};

export default async function LoginPage() {
  return (
    <LoginPageServer />
  );
}
