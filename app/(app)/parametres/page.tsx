import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { euros } from "@/lib/format";
import { FORMATS, type FormatKey } from "@/lib/constants";
import type { Param } from "@/types/database";

type PackDetail = { name: string; valeur: number };

function isPackDetails(d: Param["details"]): d is PackDetail[] {
  return Array.isArray(d);
}

export default async function ParametresPage() {
  await requireModule("parametres");
  const supabase = createClient();

  const { data } = await supabase
    .from("params")
    .select("*")
    .order("type")
    .order("format");

  const params = data ?? [];
  const impression = params.filter((p) => p.type === "Impression");
  const packaging = params.filter((p) => p.type === "Packaging");

  // Coût de revient unitaire par format = impression + packaging.
  const coutRevient = (Object.keys(FORMATS) as FormatKey[]).map((fmt) => {
    const imp = impression.find((p) => p.format === fmt)?.valeur ?? 0;
    const pack = packaging.find((p) => p.format === fmt)?.valeur ?? 0;
    return { fmt, prix: FORMATS[fmt].prix, imp, pack, total: imp + pack };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Coûts unitaires d'impression et de packaging par format."
      />

      {/* Coût de revient synthétique */}
      <Card>
        <CardHeader
          title="Coût de revient par format"
          subtitle="Impression + packaging, hors commission artiste."
        />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                <th className="px-5 py-3 font-semibold">Format</th>
                <th className="px-5 py-3 font-semibold">Prix de vente</th>
                <th className="px-5 py-3 font-semibold">Impression</th>
                <th className="px-5 py-3 font-semibold">Packaging</th>
                <th className="px-5 py-3 text-right font-semibold">
                  Coût de revient
                </th>
              </tr>
            </thead>
            <tbody>
              {coutRevient.map((r) => (
                <tr key={r.fmt} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <Badge variant="gray">{r.fmt}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-text">
                    {euros(r.prix)}
                  </td>
                  <td className="px-5 py-3 text-muted">{euros(r.imp)}</td>
                  <td className="px-5 py-3 text-muted">{euros(r.pack)}</td>
                  <td className="px-5 py-3 text-right font-medium text-text">
                    {euros(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Détail du packaging (jsonb) */}
      <div className="grid gap-4 md:grid-cols-2">
        {packaging.map((p) => (
          <Card key={p.id}>
            <CardHeader
              title={`Packaging ${p.format}`}
              subtitle={`Total ${euros(p.valeur)}`}
            />
            <CardBody className="p-0">
              {isPackDetails(p.details) && p.details.length > 0 ? (
                <ul>
                  {p.details.map((d, i) => (
                    <li
                      key={`${p.id}-${i}`}
                      className="flex items-center justify-between border-b border-border px-5 py-2.5 text-sm last:border-0"
                    >
                      <span className="text-muted">{d.name}</span>
                      <span className="font-medium text-text">
                        {euros(d.valeur)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-faint">
                  Aucun détail renseigné.
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
