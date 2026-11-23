import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDropContracts } from "@/lib/data/drop-contracts";
import { contractFileName } from "@/lib/contracts/filename";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) {
    return new NextResponse("Accès refusé", { status: 403 });
  }

  const data = await getDropContracts(params.id);
  if (!data.drop) return new NextResponse("Campagne introuvable", { status: 404 });

  // Brouillons du drop uniquement (le zip sert à envoyer en signature).
  const drafts = data.rows.filter((r) => r.contract?.status === "brouillon" && r.contract.pdf_path);
  if (drafts.length === 0) {
    return new NextResponse("Aucun contrat brouillon à télécharger.", { status: 404 });
  }

  const admin = createAdminClient();
  const zip = new JSZip();
  const used = new Set<string>();

  for (const r of drafts) {
    const path = r.contract!.pdf_path!;
    const { data: file } = await admin.storage.from("contracts").download(path);
    if (!file) continue;
    let name = contractFileName(data.campaign_number, r.full_name);
    // Évite l'écrasement si deux artistes ont le même « Prénom Nom ».
    if (used.has(name)) {
      const base = name.replace(/\.pdf$/i, "");
      let i = 2;
      while (used.has(`${base} (${i}).pdf`)) i++;
      name = `${base} (${i}).pdf`;
    }
    used.add(name);
    zip.file(name, Buffer.from(await file.arrayBuffer()));
  }

  const bytes = await zip.generateAsync({ type: "nodebuffer" });
  const zipName = `Contrats-${(data.drop.name ?? "campagne").replace(/[^a-zA-Z0-9._-]/g, "-")}.zip`;

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}
