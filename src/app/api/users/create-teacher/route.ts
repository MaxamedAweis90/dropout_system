import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase URL or Service Role Key is not configured" }, { status: 500 });
    }

    // Initialize Supabase Admin Client using the service role key to bypass RLS/policies
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "dropout",
      },
    });

    // Verify token and retrieve the user session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Auth Check: Verify that the requesting user exists in dropout.administrators
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from("administrators")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Action: Create the user in Supabase Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "teacher", name },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const newUserId = userData.user.id;

    // Database: Insert the teacher profile into dropout.teachers
    const { error: insertError } = await supabaseAdmin
      .from("teachers")
      .insert({
        id: newUserId,
        name,
        email,
      });

    if (insertError) {
      console.error("DB insert error after auth creation:", insertError);
      // Clean up the auth user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: `User created but profile insert failed: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error: any) {
    console.error("Create teacher route error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
