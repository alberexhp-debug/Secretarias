import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelNav from "@/components/PanelNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) redirect("/login");
  if (!user.onboardingDone) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <PanelNav userName={user.name} secretaryName={user.secretary?.name || "Tu secretario"} secretaryAvatar={user.secretary?.avatarId || "avatar-1"} />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
