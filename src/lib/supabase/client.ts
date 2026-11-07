import { createBrowserClient } from "@supabase/ssr";

// ブラウザ用クライアント。セッションは cookie に置き、将来サーバー側で読めるようにしておく
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
