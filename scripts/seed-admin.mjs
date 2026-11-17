if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !secretKey || !email || !password) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.",
  );
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error && error.code !== "email_exists") {
  throw error;
}
const userAlreadyExists = error?.code === "email_exists";

let userId = data.user?.id;

if (!userId) {
  const { data: users, error: usersError } =
    await supabase.auth.admin.listUsers();

  if (usersError) throw usersError;
  userId = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id;
}

if (!userId) {
  throw new Error("The Auth user was not found after creation.");
}

if (userAlreadyExists) {
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { password, email_confirm: true },
  );
  if (updateError) throw updateError;
}

const { error: profileError } = await supabase
  .from("admin_profiles")
  .upsert({ id: userId, email }, { onConflict: "id" });

if (profileError) throw profileError;

console.log(`Admin seeded: ${email}`);
