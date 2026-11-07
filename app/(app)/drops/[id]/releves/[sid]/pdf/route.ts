import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStatementForPdf } from "@/lib/data/royalties";
import { renderStatementPdf } from "@/lib/royalties/generateStatementPdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string; sid: string } }) {
  await requireModule("finances");
  const supabase = createClient();

  const { data: st } = await supabase
    .from("royalty_statements")
    .select("pdf_path, number")
    .eq("id", params.sid)
    .maybeSingle();
  if (!st) return new NextResponse("Relevé introuvable", { status: 404 });

  let bytes: Buffer | null = null;
  if (st.pdf_path) {
    const admin = createAdminClient();
    const { data: file } = await admin.storage.from("royalty-statements").download(st.pdf_path);
    if (file) bytes = Buffer.from(await file.arrayBuffer());
  }
  if (!bytes) {
    const data = await getStatementForPdf(params.sid);
    if (!data) return new NextResponse("Données indisponibles", { status: 404 });
    bytes = await renderStatementPdf(data);
  }

  const name = (st.number ?? "releve").replace(/[^a-zA-Z0-9._-]/g, "-");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
    },
  });
}
