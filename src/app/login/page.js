import LoginPageServer from "@/components/server/LoginPageServer";

export const metadata = {
  title: "Login | MyShaadiStore",
  description: "Log in to view your profile, orders, and wedding journey.",
};

export default async function LoginPage() {
  return (
    <LoginPageServer />
  );
}
