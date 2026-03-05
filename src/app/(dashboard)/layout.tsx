import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardNav from "@/components/layout/DashboardNav";
import { VoiceProvider } from "@/lib/voice-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, status")
    .eq("id", user.id)
    .single();

  // 승인 대기/거절 시 접근 차단
  if (profile?.status === "pending") redirect("/pending");
  if (profile?.status === "rejected") redirect("/pending");

  return (
    <div className="min-h-screen bg-white">
      <VoiceProvider>
        <DashboardNav nickname={profile?.nickname ?? "친구"} />
        <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {children}
        </main>
      </VoiceProvider>
    </div>
  );
}
