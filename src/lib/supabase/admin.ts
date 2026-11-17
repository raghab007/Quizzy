import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function requireAdmin() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const serviceClient = createServiceClient();
  const { data: profile, error } = await serviceClient
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("FORBIDDEN");
  return serviceClient;
}
