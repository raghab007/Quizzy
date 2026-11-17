import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase.from("topics").select("id, name").order("name");
    if (error) throw error;
    return NextResponse.json({ topics: data });
  } catch {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  }
}
