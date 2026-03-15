// lib/supabase/server.js
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function supabaseServer() {
  return createServerClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookies, // Pass the cookies helper
  })
}
