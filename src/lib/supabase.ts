import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
