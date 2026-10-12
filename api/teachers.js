
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST required" });
  }

  const expected = process.env.TEACHER_SETUP_SECRET;
  const supplied = req.headers["x-teacher-setup-secret"];

  if (!expected || supplied !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      error: "Missing Supabase server configuration"
    });
  }

  const teachers = [
    { code: "AP", email: "amanshree9.iitr@gmail.com", id: "22cd9f60-f559-4f42-aeb8-57dccc749793" },
    { code: "GM", email: "gajendrakrbooks@gmail.com", id: "5009b7fb-b74b-4fda-93da-587d47f47820" },
    { code: "NC", email: "nitishkumar5147@gmail.com", id: "1e58ccc4-9662-40dc-9cda-7d4f85bf2a4d" },
    { code: "DC", email: "iitchem.shukla@gmail.com", id: "6b19e2a3-3d57-4ef2-a8d1-af554a7d8460" },
    { code: "SM", email: "sanjana00048@gmail.com", id: "0954b6c2-16ba-4cb2-9c5b-f7ae30b4bfea" },
    { code: "RB", email: "rashrsingh999@gmail.com", id: "bc02dfd0-8550-43fb-af83-d9808b2c5c22" },
    { code: "VP", email: "vijaykumar212122@gmail.com", id: "d6ef3781-e400-4c75-84c6-7426548de489" },
    { code: "MB", email: "priyankamourya45@gmail.com", id: "7ef7725e-49e9-42c6-8eff-3d8c9faf6bda" },
    { code: "PB", email: "pranayjha801@gmail.com", id: "d53e0ee7-76b0-4379-9b2a-012d9e794c88" }
  ];

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  async function request(path, options = {}) {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    return data;
  }

  function temporaryPassword() {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(bytes, b => chars[b % chars.length]).join("");
  }

  try {
    const authUsers = [];
    for (let page = 1; page <= 10; page++) {
      const result = await request(
        `/auth/v1/admin/users?page=${page}&per_page=100`
      );
      const users = result.users || [];
      authUsers.push(...users);
      if (users.length < 100) break;
    }

    const results = [];

    for (const teacher of teachers) {
      let user = authUsers.find(
        u => (u.email || "").toLowerCase() === teacher.email
      );
      let password = null;
      let status = "existing account";

      if (!user) {
        password = temporaryPassword();
        user = await request("/auth/v1/admin/users", {
          method: "POST",
          body: JSON.stringify({
            email: teacher.email,
            password,
            email_confirm: true,
            user_metadata: { teacher_code: teacher.code }
          })
        });
        status = "created";
      }

      const existing = await request(
        `/rest/v1/pace_teacher_accounts?user_id=eq.${user.id}&select=user_id`
      );

      if (existing.length) {
        await request(
          `/rest/v1/pace_teacher_accounts?user_id=eq.${user.id}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ teacher_id: teacher.id })
          }
        );
      } else {
        await request("/rest/v1/pace_teacher_accounts", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            user_id: user.id,
            teacher_id: teacher.id
          })
        });
      }

      results.push({
        code: teacher.code,
        email: teacher.email,
        status,
        linked: true,
        ...(password ? { temporary_password: password } : {})
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Teacher setup completed",
      results
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Setup stopped. Check Supabase schema and logs.",
      detail: String(error.message || error).slice(0, 500)
    });
  }
}
