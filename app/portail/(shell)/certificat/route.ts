import { NextResponse, type NextRequest } from "next/server";
import { requireArtist } from "@/lib/auth/session";
import { getMyArtist } from "@/lib/data/portal";
import { getPrecompteCertificate } from "@/lib/data/royalties";
import { renderCertificatePdf } from "@/lib/royalties/generateCertificatePdf";

export const runtime = "nodejs";

/** Certificat de précompte annuel de l'artiste connecté (scopé à son propre id). */
export async function GET(req: NextRequest) {
  await requireArtist();
  const artist = await getMyArtist();
  if (!artist) return new NextResponse("Introuvable", { status: 404 });

  const year = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear() - 1;
  const data = await getPrecompteCertificate(artist.id, year);
  if (!data) return new NextResponse(`Aucun précompte en ${year}`, { status: 404 });

  const pdf = await renderCertificatePdf(data);
  const safe = data.artist.display_name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificat-precompte-${safe}-${year}.pdf"`,
    },
  });
}
