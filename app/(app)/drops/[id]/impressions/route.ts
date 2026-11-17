import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { getCampaignPrintList } from "@/lib/data/impressions";
import { renderPrintListPdf } from "@/lib/print/generatePrintListPdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requireModule("drops");

  const data = await getCampaignPrintList(params.id);
  if (!data.drop) return new NextResponse("Campagne introuvable", { status: 404 });

  const bytes = await renderPrintListPdf(data);
  const name = `impressions-${(data.drop.name ?? "campagne").replace(/[^a-zA-Z0-9._-]/g, "-")}`;

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
    },
  });
}
