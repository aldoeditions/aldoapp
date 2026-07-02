"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FileDownloadButton({
  bucket,
  path,
  label = "Télécharger",
}: {
  bucket: string;
  path: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 120);
    setLoading(false);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:underline disabled:opacity-60"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
      {loading ? "…" : label}
    </button>
  );
}
