import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  userId: string;
  fullName: string;
  role: string;
}

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, fullName, role }: RequestBody = await req.json();

    // Validate inputs
    if (!userId || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key (has full access)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Insert profile with service role (bypasses RLS)
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
      });

    if (error) {
      console.error("Profile insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
