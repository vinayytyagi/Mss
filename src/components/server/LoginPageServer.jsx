import LoginFlow from "@/components/LoginFlow";
import { fetchJourneySteps } from "@/lib/api";

export default async function LoginPageServer() {
  let steps = [];
  try {
    steps = await fetchJourneySteps();
  } catch {
    steps = [];
  }

  return (
    <LoginFlow initialSteps={steps} />
  );
}
