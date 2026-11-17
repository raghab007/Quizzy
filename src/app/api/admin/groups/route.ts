import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("groups")
      .select("id, name")
      .order("name");
    if (error) throw error;
    return NextResponse.json({ groups: data });
  } catch {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await requireAdmin();
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Group name is required." }, { status: 400 });
    const { data, error } = await supabase
      .from("groups")
      .insert({ name })
      .select("id, name")
      .single();
    if (error) return NextResponse.json({ error: "That group already exists." }, { status: 409 });
    return NextResponse.json({ group: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create group." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Group id is required." }, { status: 400 });
    const { count, error: countError } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("group_id", id);
    if (countError) throw countError;
    if (count) return NextResponse.json({ error: "This group has students and cannot be deleted." }, { status: 409 });
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete group." }, { status: 400 });
  }
}
