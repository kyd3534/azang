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
    .select("nickname")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-white">
      <VoiceProvider>
        <DashboardNav nickname={profile?.nickname ?? "친구"} isAdmin={user.email === "kyd3534@gmail.com"} />
        <main className="w-full px-3 sm:px-6 py-4 sm:py-8">
          {children}
        </main>
      </VoiceProvider>
    </div>
  );
}
