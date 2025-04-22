import { getCurrentUser } from "@/lib/getCurrentUser";
import CallPage from "./CallPage";
export default async function Call() {
  const user = await getCurrentUser();
  return <CallPage user={user} />;
}
