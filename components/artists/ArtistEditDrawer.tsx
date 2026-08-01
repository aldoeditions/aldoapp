"use client";

import { Drawer } from "@/components/ui/Drawer";
import { ArtistForm } from "./ArtistForm";
import type { Artist } from "@/types/database";

/** Drawer d'édition d'un artiste/prospect (formulaire complet). */
export function ArtistEditDrawer({
  artist,
  open,
  onClose,
  mode = "full",
}: {
  artist: Artist | null;
  open: boolean;
  onClose: () => void;
  mode?: "prospect" | "full";
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === "prospect" ? "Modifier le prospect" : "Modifier l'artiste"}
    >
      {open && artist && <ArtistForm artist={artist} mode={mode} />}
    </Drawer>
  );
}
