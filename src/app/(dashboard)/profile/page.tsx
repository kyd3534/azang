"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      supabase.from("profiles").select("nickname").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.nickname) setNickname(data.nickname);
        });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ nickname, updated_at: new Date().toISOString() }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">프로필 설정</h1>

      <div className="rounded-xl bg-white shadow-notion p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>이메일</Label>
            <Input value={email} disabled className="bg-gray-50 text-gray-400" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              placeholder="아장이"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : saved ? "저장됐어요! ✓" : "저장하기"}
          </Button>
        </form>
      </div>
    </div>
  );
}
