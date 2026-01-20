import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { email } = await req.json();
    const supabase = supabaseServer();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
    });

    if (error) return Response.json({ success: false, message: error.message }, { status: 400 });
    return Response.json({ success: true, message: "Password reset sent" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
