"use server";

import { createServerSupabaseClient } from "./supabase-server";

const ADMIN_EMAIL = "kyd3534@gmail.com";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("권한 없음");
  return supabase;
}

export async function approveUser(userId: string) {
  const supabase = await requireAdmin();
  await supabase.from("profiles").update({ status: "approved" }).eq("id", userId);
}

export async function rejectUser(userId: string) {
  const supabase = await requireAdmin();
  await supabase.from("profiles").update({ status: "rejected" }).eq("id", userId);
}

export async function getPendingUsers() {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, email, status, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}
