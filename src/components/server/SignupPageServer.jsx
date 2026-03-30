import SignupFlow from "@/components/SignupFlow";
import { fetchJourneySteps } from "@/lib/api";

export default async function SignupPageServer() {
  let steps = [];
  try {
    steps = await fetchJourneySteps();
  } catch {
    steps = [];
  }

  return <SignupFlow initialSteps={steps} />;
}

