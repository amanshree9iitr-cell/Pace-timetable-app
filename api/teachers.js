
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const expected = process.env.TEACHER_SETUP_SECRET;
  const supplied = req.headers["x-teacher-setup-secret"];

  if (!expected || !supplied || supplied !== expected) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return res.status(500).json({
      ok: false,
      error: "Supabase server configuration is incomplete"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Secure endpoint verified.",
    nextStep: "Account provisioning is not enabled yet."
  });
}
