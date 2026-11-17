import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("groups")
      .select("id, name")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ groups: data });
  } catch (error) {
    console.error("Unable to load groups:", error);
    return NextResponse.json(
      { error: "Unable to load student groups right now." },
      { status: 500 },
    );
  }
}
