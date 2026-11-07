import { NextResponse } from "next/server";
import { requireArtist } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** PDF d'un relevé pour l'artiste connecté. RLS : seulement SES relevés émis/payés. */
export async function GET(_req: Request, { params }: { params: { sid: string } }) {
  await requireArtist();
  const supabase = createClient();

  // RLS : renvoie null si le relevé n'est pas à l'artiste ou n'est pas émis/payé.
  const { data: st } = await supabase
    .from("royalty_statements")
    .select("pdf_path, number")
    .eq("id", params.sid)
    .maybeSingle();
  if (!st || !st.pdf_path) return new NextResponse("Relevé indisponible", { status: 404 });

  const admin = createAdminClient();
  const { data: file } = await admin.storage.from("royalty-statements").download(st.pdf_path);
  if (!file) return new NextResponse("Fichier indisponible", { status: 404 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = (st.number ?? "releve").replace(/[^a-zA-Z0-9._-]/g, "-");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
    },
  });
}
