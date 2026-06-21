import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 },
      );
    }
    const token = authHeader.split(" ")[1];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Is Service Role Key loaded:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase URL or Service Role Key is not configured" },
        { status: 500 },
      );
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
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.log("Auth error verifying token:", authError);
      return NextResponse.json(
        { error: `Unauthorized: Invalid token. Auth Error: ${authError?.message || "User not found"}` },
        { status: 401 },
      );
    }

    const userId = user.id;
    console.log("Verifying userId:", userId);

    const { mode } = await request.json();
    if (!mode || (mode !== "admin" && mode !== "teacher")) {
      return NextResponse.json(
        { error: "Invalid mode parameter" },
        { status: 400 },
      );
    }

    if (mode === "admin") {
      // Query the administrators table
      const { data: adminData, error: dbError } = await supabaseAdmin
        .schema("dropout")
        .from("administrators")
        .select("id, name, is_super_admin")
        .eq("id", userId)
        .maybeSingle();

      console.log("Supabase Response (data):", adminData);
      console.log("Supabase Response (error):", dbError);

      if (dbError || !adminData) {
        return NextResponse.json(
          {
            error: dbError
              ? `Unauthorized: Administrator access required. DB Error: ${dbError.message}`
              : "Unauthorized: Administrator access required",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        name: adminData.name,
        isSuperAdmin:
          adminData.is_super_admin === true ||
          adminData.is_super_admin === "true" ||
          false,
      });
    } else {
      // Query the teachers table
      const { data: teacherData, error: dbError } = await supabaseAdmin
        .schema("dropout")
        .from("teachers")
        .select("id, name")
        .eq("id", userId)
        .maybeSingle();

      console.log("Supabase Response (data):", teacherData);
      console.log("Supabase Response (error):", dbError);

      if (dbError || !teacherData) {
        return NextResponse.json(
          {
            error: dbError
              ? `Unauthorized: You are not registered as a Faculty Member. DB Error: ${dbError.message}`
              : "Unauthorized: You are not registered as a Faculty Member",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        name: teacherData.name,
        teacherId: teacherData.id?.toString(),
      });
    }
  } catch (error: any) {
    console.error("Auth verify route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
