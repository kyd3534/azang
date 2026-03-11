"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";

interface ColoringTemplate {
  id: string;
  name: string;
  storage_path: string;
}

export default function ColoringListPage() {
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [templateUrls, setTemplateUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("coloring_templates")
      .select("id, name, storage_path")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        setTemplates(data);
        const urls: Record<string, string> = {};
        data.forEach((t) => {
          const { data: { publicUrl } } = supabase.storage
            .from("coloring_templates")
            .getPublicUrl(t.storage_path);
          urls[t.id] = publicUrl;
        });
        setTemplateUrls(urls);
      });
  }, []);

  return (
    <div>
      <PageHeader title="색칠하기" emoji="🦋" />

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="text-sm font-semibold" style={{ color: "#FF8A50" }}>
            아직 도안이 없어요. 곧 추가될 예정이에요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/coloring/template/${t.id}`}
              className="group rounded-2xl bg-white overflow-hidden transition-all hover:-translate-y-1"
              style={{ border: "2px solid #FFE8D6", boxShadow: "0 4px 16px rgba(255,140,50,0.12)" }}
            >
              <div
                className="w-full aspect-[4/5] overflow-hidden flex items-center justify-center"
                style={{ background: "#FFFBF5" }}
              >
                {templateUrls[t.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={templateUrls[t.id]}
                    alt={t.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-4xl">🖼️</span>
                )}
              </div>
              <div className="px-3 pb-3 pt-2">
                <div
                  className="w-full py-1.5 rounded-xl text-xs font-bold text-center transition-all group-hover:opacity-90"
                  style={{ background: "linear-gradient(90deg,#FF8A50,#FF5722)", color: "white" }}
                >
                  색칠하기 🖌️
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
