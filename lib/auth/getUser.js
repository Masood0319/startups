import { supabaseServer } from "@/lib/supabase/server";

export async function getServerUser() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
