import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sql`SELECT 1 AS conectado`;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false },
      { status: 503 }
    );
  }
}
